'use strict';

import EventDispatcher from './common/event-dispatcher';
import SequentialTimer from './common/sequential-timer';

const p = Object.freeze({
  settings: Symbol('settings'),
  net: Symbol('net'),

  watchTimer: Symbol('watchTimer'),
  watchEventBus: Symbol('watchEventBus'),
  watchChannels: Symbol('watchChannels'),

  // Private methods.
  getURL: Symbol('getURL'),
  onceOnline: Symbol('onceOnline'),
  onceAuthenticated: Symbol('onceAuthenticated'),
  onceDocumentVisible: Symbol('onceDocumentVisible'),
  onceReady: Symbol('onceReady'),
  getChannelValues: Symbol('getChannelValues'),
  updateChannelValue: Symbol('updateChannelValue'),
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
    this[p.watchChannels] = new Map();

    this[p.getChannelValues] = this[p.getChannelValues].bind(this);

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
   * Registers watcher for the channel with specified id.
   *
   * @todo We may need to accept channels's "supports_fetch" property in the
   * future too, to validate channel value type.
   *
   * @param {string} channelId Id of the channel we'd like to watch.
   * @param {function} handler Handler to be executed once watched value is
   * changed.
   */
  watch(channelId, handler) {
    this[p.watchEventBus].on(channelId, handler);

    if (this[p.watchChannels].has(channelId)) {
      return;
    }

    this[p.watchChannels].set(channelId, {
      id: channelId,
      // Using null as initial value, some channels can return null when value
      // is not yet available, so it perfectly fits our case.
      value: null,
    });

    // We automatically start watching if at least one channel is requested to
    // be watched.
    if (!this[p.watchTimer].started) {
      this[p.watchTimer].start(this[p.getChannelValues]);
    }
  }

  /**
   * Unregisters watcher for the channel with specified id.
   *
   * @param {string} channelId Id of the channel we'd like to not watch anymore.
   * @param {function} handler Handler function that has been used with "watch"
   * previously.
   */
  unwatch(channelId, handler) {
    if (!this[p.watchChannels].has(channelId)) {
      console.warn('Channel with id "%s" is not watched.', channelId);
      return;
    }

    this[p.watchEventBus].off(channelId, handler);

    // If there is no more listeners, we should not watch this channel anymore.
    if (!this[p.watchEventBus].hasListeners(channelId)) {
      this[p.watchChannels].delete(channelId);
    }

    // If no more channels are watched let's stop watching.
    if (this[p.watchChannels].size === 0) {
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
   * Fetches values for the set of channels.
   *
   * @return {Promise}
   * @private
   */
  [p.getChannelValues]() {
    // It may happen that all watchers have been unregistered in the meantime,
    // so let's return early in this case.
    if (this[p.watchChannels].size === 0) {
      return Promise.resolve();
    }

    const selectors = Array.from(this[p.watchChannels].values()).map(
      ({ id }) => ({ id })
    );

    return this.put('channels/get', selectors)
      .then((response) => {
        Object.keys(response).forEach((key) => {
          const channel = this[p.watchChannels].get(key);
          if (!channel) {
            return;
          }

          this[p.updateChannelValue](channel, response[key]);
        });
      });
  }

  /**
   * Updates channel value if needed. If value has changed, appropriate event is
   * fired.
   *
   * @param {{ id: string, value: * }} channel Channel to update value for.
   * @param {*} newValue New channel value returned from the server.
   *
   * @private
   */
  [p.updateChannelValue](channel, newValue) {
    let valueChanged = false;

    if (!newValue || !channel.value) {
      valueChanged = newValue !== channel.value;
    } else {
      const [valueType] = Object.keys(newValue);
      if (valueType === 'Error') {
        console.error(
          'Failed to retrieve value for channel (%s): %o',
          channel.id,
          newValue[valueType]
        );

        return;
      }

      if (newValue && channel.value && typeof channel.value === 'object') {
        // @todo If value is a non-null object, we use their JSON representation
        // to compare values. It's not performant and not reliable at all, but
        // this OK until we have such values, once we support them we should
        // have dedicated utility function for deep comparing objects.
        valueChanged = JSON.stringify(newValue) !==
          JSON.stringify(channel.value);
      } else {
        valueChanged = newValue !== channel.value;
      }
    }

    if (valueChanged) {
      // In ES6, a non-object argument will be treated as if it was a frozen
      // ordinary object, so it's simply returned.
      channel.value = Object.freeze(newValue);
      this[p.watchEventBus].emit(channel.id, channel.value);
    }
  }
}
