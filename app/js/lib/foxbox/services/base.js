'use strict';

import EventDispatcher from '../common/event-dispatcher';

const TYPE = 'unknown';

const p = Object.freeze({
  // Private properties.
  api: Symbol('api'),

  // Public getter only properties.
  id: Symbol('id'),
  manufacturer: Symbol('manufacturer'),
  model: Symbol('model'),
  name: Symbol('name'),
  watchers: Symbol('watchers'),
  tags: Symbol('tags'),
  channels: Symbol('channels'),

  // Private methods.
  getChannels: Symbol('getChannel'),
  getFetchChannel: Symbol('getFetchChannel'),
  getSendChannel: Symbol('getSendChannel'),
});

export default class BaseService extends EventDispatcher {
  constructor(props, api, allowedEvents, watchers) {
    super(allowedEvents);

    // Private properties.
    this[p.api] = api;

    // Public getter only properties.
    this[p.id] = props.id;
    this[p.manufacturer] = props.properties && props.properties.manufacturer ||
      '';
    this[p.model] = props.properties && props.properties.model || '';
    // Some service don't have name, but can have product_name instead.
    this[p.name] = props.properties && props.properties.name ||
      props.properties.product_name || '';
    this[p.tags] = new Set(props.tags);
    this[p.channels] = props.channels;
    this[p.watchers] = watchers || new Map();
  }

  get type() {
    return TYPE;
  }

  get id() {
    return this[p.id];
  }

  get manufacturer() {
    return this[p.manufacturer];
  }

  get model() {
    return this[p.model];
  }

  get name() {
    return this[p.name];
  }

  /**
   * Sets a value via sending it to a service channel.
   *
   * @param {Object|string} selector Selector for the channel to use.
   * @param {*} value Value to set.
   * @return {Promise}
   */
  set(selector, value = null) {
    const { id, feature } = this[p.getSendChannel](selector);
    return this[p.api].put(
      'channels/set',
      { select: { id, feature }, value }
    );
  }

  /**
   * Gets a value from a service channel.
   *
   * @param {Object} selector Selector for the channel to use.
   * @return {Promise}
   */
  get(selector) {
    const channel = this[p.getFetchChannel](selector);
    const returns = channel.supports_fetch.returns;
    const payload = { id: channel.id, feature: channel.feature };

    // If we expect binary data let's request it properly.
    if (returns && (returns.requires || returns.optional) === 'Binary') {
      return this[p.api].blob('channels/get', payload);
    }

    // We request channel value by unique channel id, so we can have only
    // results for this channel.
    return this[p.api].put('channels/get', payload)
      .then((response) => response[channel.id]);
  }

  /**
   * Setups value watcher for the channel matching specified selector.
   *
   * @param {string} alias Watcher alias to match channel which value we would
   * like to watch.
   * @param {function} handler Function to be called once channel value changes.
   */
  watch(alias, handler) {
    const watcher = this[p.watchers].get(alias);
    if (!watcher) {
      throw new Error('Unsupported watcher `${alias}`!');
    }

    const [selector, processor, wrappedHandlers = new Map()] = watcher;
    if (wrappedHandlers.size === 0) {
      watcher.push(wrappedHandlers);
    }

    let wrappedHandler = wrappedHandlers.get(handler);
    if (!wrappedHandler) {
      wrappedHandler = (value) => handler(this[processor](value));
      wrappedHandlers.set(handler, wrappedHandler);
    }

    const { id, feature } = this[p.getFetchChannel](selector);
    this[p.api].watch(id, feature, wrappedHandler);
  }

  /**
   * Removes value watcher for the channel matching specified selector.
   *
   * @param {string} alias Watcher alias to match channel for which we would
   * like to remove value watcher.
   * @param {function} handler Function that was used in corresponding watch
   * call.
   */
  unwatch(alias, handler) {
    const watcher = this[p.watchers].get(alias);
    if (!watcher) {
      throw new Error('Unsupported watcher `${alias}`!');
    }

    const [selector,, wrappedHandlers] = watcher;

    const wrappedHandler = wrappedHandlers.get(handler);
    wrappedHandlers.delete(handler);

    const { id: channelId } = this[p.getFetchChannel](selector);
    this[p.api].unwatch(channelId, wrappedHandler);
  }

  /**
   * Returns list of service tags.
   *
   * @return {Array<string>}
   */
  getTags() {
    // Return a copy of the set in the form of plain array, to avoid side
    // modifications.
    return Array.from(this[p.tags]);
  }

  /**
   * Adds specified tag to the service/all its channels tag list.
   *
   * @param {string} tag Tag to add.
   * @return {Promise}
   */
  addTag(tag) {
    if (!tag || typeof tag !== 'string') {
      throw new Error('Tag should be valid non-empty string.');
    }

    if (this[p.tags].has(tag)) {
      return Promise.resolve();
    }

    this[p.tags].add(tag);

    // For now we mark channels with the specified tag as well, so that tag can
    // be picked up from the places that don't have access to the service
    // instance (eg. recipes view).
    const servicesSelector = { services: { id: this[p.id] }, tags: tag };
    const channelsSelector = { channels: { service: this[p.id] }, tags: tag };

    return Promise.all([
      this[p.api].post('services/tags', servicesSelector),
      this[p.api].post('channels/tags', channelsSelector),
    ])
    .catch((error) => {
      this[p.tags].delete(tag);
      throw error;
    });
  }

  /**
   * Removes specified tag from the service/all its channels tag list.
   *
   * @param {string} tag Tag to remove.
   * @return {Promise}
   */
  removeTag(tag) {
    if (!tag || typeof tag !== 'string') {
      throw new Error('Tag should be valid non-empty string.');
    }

    if (!this[p.tags].has(tag)) {
      return Promise.resolve();
    }

    this[p.tags].delete(tag);

    const servicesSelector = { services: { id: this[p.id] }, tags: tag };
    const channelsSelector = { channels: { service: this[p.id] }, tags: tag };

    return Promise.all([
      this[p.api].delete('services/tags', servicesSelector),
      this[p.api].delete('channels/tags', channelsSelector),
    ])
    .catch((error) => {
      this[p.tags].add(tag);
      throw error;
    });
  }

  /**
   * Method that should be called when service instance is not needed anymore.
   * Classes that extend BaseService and override this method should always call
   * super.teardown() method as well.
   */
  teardown() {
    for (const watcher of this[p.watchers].values()) {
      const [selector,, wrappedHandlers] = watcher;

      // If nobody set up watchers or all watchers has been properly unwatched,
      // we don't have anything to do here.
      if (!wrappedHandlers || wrappedHandlers.size === 0) {
        continue;
      }

      const { id: channelId } = this[p.getFetchChannel](selector);
      for (const wrappedHandler of wrappedHandlers.values()) {
        console.warn(`Forgotten watcher for ${channelId}!`);
        this[p.api].unwatch(channelId, wrappedHandler);
      }

      wrappedHandlers.clear();
    }
  }

  /**
   * Returns list of channels that match to specified selector.
   * @param {Object|string} selector Selector that channel should match to.
   * @return {Array<Object>}
   * @private
   */
  [p.getChannels](selector) {
    if (selector.id) {
      const channel = this[p.channels][selector.id];
      return channel ? [channel] : [];
    }

    if (selector.feature || typeof selector === 'string') {
      const channelFeature = selector.feature || selector;

      return Object.keys(this[p.channels]).reduce((channels, key) => {
        const channel = this[p.channels][key];

        if (channel.feature === channelFeature) {
          channels.push(channel);
        }

        return channels;
      }, []);
    }

    return [];
  }

  /**
   * Returns channel that supports fetch operation and matches to specified
   * selector.
   *
   * @param {Object|string} selector Selector that channel should match to.
   * @return {Object}
   * @throws Will throw if there is no channel that corresponds to selector and
   * supports fetch operation.
   * @private
   */
  [p.getFetchChannel](selector) {
    const channel = this[p.getChannels](selector).find(
      (channel) => channel.supports_fetch
    );

    if (!channel) {
      throw new Error(
        `Couldn't find channel that supports "fetch" with selector: ${selector}`
      );
    }

    return channel;
  }

  /**
   * Returns channel that supports send operation and matches to specified
   * selector.
   *
   * @param {Object|string} selector Selector that channel should match to.
   * @return {Object}
   * @throws Will throw if there is no channel that corresponds to selector and
   * supports send operation.
   * @private
   */
  [p.getSendChannel](selector) {
    const channel = this[p.getChannels](selector).find(
      (channel) => channel.supports_send
    );

    if (!channel) {
      throw new Error(
        `Couldn't find channel that supports "send" with selector: ${selector}`
      );
    }

    return channel;
  }
}
