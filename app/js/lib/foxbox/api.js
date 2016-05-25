'use strict';

import EventDispatcher from './common/event-dispatcher';
import SequentialTimer from './common/sequential-timer';

const p = Object.freeze({
  settings: Symbol('settings'),
  net: Symbol('net'),

  watchTimer: Symbol('watchTimer'),
  watchEventBus: Symbol('watchEventBus'),
  watchGetters: Symbol('watchGetters'),

  // Private methods.
  getURL: Symbol('getURL'),
  onceOnline: Symbol('onceOnline'),
  onceAuthenticated: Symbol('onceAuthenticated'),
  onceDocumentVisible: Symbol('onceDocumentVisible'),
  onceReady: Symbol('onceReady'),
  fetchGetterValues: Symbol('fetchGetterValues'),
  updateGetterValue: Symbol('updateGetterValue'),
});

/**
 * Instance of the API class is intended to abstract consumer from the API
 * specific details (e.g. API base URL and version). It also tracks
 * availability of the network, API host and whether correct user session is
 * established. If any of this conditions is not met all API requests are
 * blocked until it's possible to perform them, so consumer doesn't have to
 * care about these additional checks.
 */
export default class API {
  constructor(net, settings) {
    this[p.net] = net;
    this[p.settings] = settings;

    this[p.watchTimer] = new SequentialTimer(this[p.settings].watchInterval);
    this[p.watchEventBus] = new EventDispatcher();
    this[p.watchGetters] = new Map();

    this[p.fetchGetterValues] = this[p.fetchGetterValues].bind(this);

    Object.freeze(this);
  }

  /**
   * Performs HTTP 'GET' API request and accepts JSON as response.
   *
   * @param {string} path Specific API resource path to be used in conjunction
   * with the base API path.
   * @return {Promise}
   */
  get(path) {
    return this[p.onceReady]()
      .then(() => this[p.net].fetchJSON(this[p.getURL](path)));
  }

  /**
   * Performs HTTP 'POST' API request and accepts JSON as response.
   *
   * @param {string} path Specific API resource path to be used in conjunction
   * with the base API path.
   * @param {Object=} body Optional object that will be serialized to JSON
   * string and sent as 'POST' body.
   * @return {Promise}
   */
  post(path, body) {
    return this[p.onceReady]()
      .then(() => this[p.net].fetchJSON(this[p.getURL](path), 'POST', body));
  }

  /**
   * Performs HTTP 'PUT' API request and accepts JSON as response.
   *
   * @param {string} path Specific API resource path to be used in conjunction
   * with the base API path.
   * @param {Object=} body Optional object that will be serialized to JSON
   * string and sent as 'PUT' body.
   * @return {Promise}
   */
  put(path, body) {
    return this[p.onceReady]()
      .then(() => this[p.net].fetchJSON(this[p.getURL](path), 'PUT', body));
  }

  /**
   * Performs HTTP 'DELETE' API request and accepts JSON as response.
   *
   * @param {string} path Specific API resource path to be used in conjunction
   * with the base API path.
   * @param {Object=} body Optional object that will be serialized to JSON
   * string and sent as 'DELETE' body.
   * @return {Promise}
   */
  delete(path, body) {
    return this[p.onceReady]()
      .then(() => this[p.net].fetchJSON(this[p.getURL](path), 'DELETE', body));
  }

  /**
   * Performs either HTTP 'GET' or 'PUT' (if body parameter is specified) API
   * request and accepts Blob as response.
   *
   * @param {string} path Specific API resource path to be used in conjunction
   * with the base API path.
   * @param {Object=} body Optional object that will be serialized to JSON
   * string and sent as 'PUT' body.
   * @param {string=} accept Mime type of the Blob we expect as a response
   * (default is image/jpeg).
   * @return {Promise}
   */
  blob(path, body, accept = 'image/jpeg') {
    return this[p.onceReady]()
      .then(() => {
        if (body) {
          return this[p.net].fetchBlob(
            this[p.getURL](path), accept, 'PUT', body
          );
        }

        return this[p.net].fetchBlob(this[p.getURL](path), accept);
      });
  }

  /**
   * Registers watcher for the getter with specified id.
   *
   * @todo We may need to accept getter kind in the future too, to validate
   * getter value type.
   *
   * @param {string} getterId Id of the getter we'd like to watch.
   * @param {function} handler Handler to be executed once watched value is
   * changed.
   */
  watch(getterId, handler) {
    this[p.watchEventBus].on(getterId, handler);

    if (this[p.watchGetters].has(getterId)) {
      return;
    }

    this[p.watchGetters].set(getterId, {
      id: getterId,
      // Using null as initial value, some getters can return null when value
      // is not yet available, so it perfectly fits our case.
      value: null,
    });

    // We automatically start watching if at least one getter is requested to
    // be watched.
    if (!this[p.watchTimer].started) {
      this[p.watchTimer].start(this[p.fetchGetterValues]);
    }
  }

  /**
   * Unregisters watcher for the getter with specified id.
   *
   * @param {string} getterId Id of the getter we'd like to not watch anymore.
   * @param {function} handler Handler function that has been used with "watch"
   * previously.
   */
  unwatch(getterId, handler) {
    if (!this[p.watchGetters].has(getterId)) {
      console.warn('Getter with id "%s" is not watched.', getterId);
      return;
    }

    this[p.watchEventBus].off(getterId, handler);

    // If there is no more listeners, we should not watch this getter anymore.
    if (!this[p.watchEventBus].hasListeners(getterId)) {
      this[p.watchGetters].delete(getterId);
    }

    // If no more getters are watched let's stop watching.
    if (this[p.watchGetters].size === 0) {
      this[p.watchTimer].stop();
    }
  }

  /**
   * Creates a fully qualified API URL based on predefined base origin, API
   * version and specified resource path.
   *
   * @param {string} path Specific API resource path to be used in conjunction
   * with the base API path and version.
   * @return {string}
   * @private
   */
  [p.getURL](path) {
    if (!path || typeof path !== 'string') {
      throw new Error('Path should be valid non-empty string.');
    }

    return `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/${path}`;
  }

  /**
   * Returns promise that is resolved once API is ready to use (API host is
   * discovered and online, authenticated user session is established and
   * document is visible).
   *
   * @returns {Promise}
   * @private
   */
  [p.onceReady]() {
    return Promise.all([
      this[p.onceOnline](),
      this[p.onceAuthenticated](),
      this[p.onceDocumentVisible](),
    ]);
  }

  /**
   * Returns promise that is resolved once API host is discovered and online.
   *
   * @returns {Promise}
   * @private
   */
  [p.onceOnline]() {
    const net = this[p.net];
    if (net.online) {
      return Promise.resolve();
    }

    return new Promise((resolve) => net.once('online', () => resolve()));
  }

  /**
   * Returns promise that is resolved once authenticated user session is
   * established.
   *
   * @returns {Promise}
   * @private
   */
  [p.onceAuthenticated]() {
    const settings = this[p.settings];
    if (settings.session) {
      return Promise.resolve();
    }

    return new Promise((resolve) => settings.once('session', () => resolve()));
  }

  /**
   * Returns promise that is resolved once document becomes visible.
   *
   * @returns {Promise}
   * @private
   */
  [p.onceDocumentVisible]() {
    if (!document.hidden) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      document.addEventListener('visibilitychange',
      function onVisibilityChange() {
        if (!document.hidden) {
          document.removeEventListener('visibilitychange', onVisibilityChange);
          resolve();
        }
      });
    });
  }

  /**
   * Fetches values for the set of getters.
   *
   * @return {Promise}
   * @private
   */
  [p.fetchGetterValues]() {
    // It may happen that all watchers have been unregistered in the meantime,
    // so let's return early in this case.
    if (this[p.watchGetters].size === 0) {
      return Promise.resolve();
    }

    const selectors = Array.from(this[p.watchGetters].values()).map(
      ({ id }) => ({ id })
    );

    return this.put('channels/get', selectors)
      .then((response) => {
        Object.keys(response).forEach((key) => {
          const getter = this[p.watchGetters].get(key);
          if (!getter) {
            return;
          }

          this[p.updateGetterValue](getter, response[key]);
        });
      });
  }

  /**
   * Updates getter value if needed. If value has changed, appropriate event is
   * fired.
   *
   * @param {{ id: string, value: Object }} getter Getter to update value for.
   * @param {Object} getterValue Getter value returned from the server.
   *
   * @private
   */
  [p.updateGetterValue](getter, getterValue) {
    let valueChanged = false;

    if (!getterValue || !getter.value) {
      valueChanged = getterValue !== getter.value;
    } else {
      const [valueKind] = Object.keys(getterValue);
      if (valueKind === 'Error') {
        console.error(
          'Failed to retrieve value for getter (%s): %o',
          getter.id,
          getterValue[valueKind]
        );

        return;
      }

      const newValue = getterValue[valueKind];
      const oldValue = getter.value[valueKind];

      if (newValue && oldValue && typeof newValue === 'object') {
        // @todo If value is a non-null object, we use their JSON representation
        // to compare values. It's not performant and not reliable at all, but
        // this OK until we have such values, once we support them we should
        // have dedicated utility function for deep comparing objects.
        valueChanged = JSON.stringify(newValue) !== JSON.stringify(oldValue);
      } else {
        valueChanged = newValue !== oldValue;
      }
    }

    if (valueChanged) {
      getter.value = Object.freeze(getterValue);
      this[p.watchEventBus].emit(getter.id, getter.value);
    }
  }
}
