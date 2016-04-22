'use strict';

const TYPE = 'unknown';

const p = Object.freeze({
  // Private properties.
  net: Symbol('net'),
  settings: Symbol('settings'),

  // Public getter only properties.
  id: Symbol('id'),
  manufacturer: Symbol('manufacturer'),
  model: Symbol('model'),
  name: Symbol('name'),
  getters: Symbol('getters'),
  setters: Symbol('setters'),
  hasGetters: Symbol('hasGetters'),
  hasSetters: Symbol('hasSetters'),

  // Private methods.
  getChannel: Symbol('getChannel'),
  getSetterValueType: Symbol('getSetterValueType'),
});

export default class BaseService {
  constructor(props, config) {
    // Private properties.
    this[p.net] = config.net;
    this[p.settings] = config.settings;

    // Public getter only properties.
    this[p.id] = props.id;
    this[p.manufacturer] = props.properties && props.properties.manufacturer ||
      '';
    this[p.model] = props.properties && props.properties.model || '';
    // Some service don't have name, but can have product_name instead.
    this[p.name] = props.properties && props.properties.name ||
      props.properties.product_name || '';
    this[p.getters] = props.getters;
    this[p.setters] = props.setters;
    this[p.hasGetters] = Object.keys(this[p.getters]).length > 0;
    this[p.hasSetters] = Object.keys(this[p.setters]).length > 0;
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

  get hasGetters() {
    return this[p.hasGetters];
  }

  get hasSetters() {
    return this[p.hasSetters];
  }

  /**
   * Call a service setter with a value.
   *
   * @param {Object|string} selector A value matching the kind of a channel.
   * @param {string|number|boolean} value
   * @return {Promise}
   */
  set(selector, value = '') {
    const setter = this[p.getChannel](this[p.setters], selector);
    const setterType = this[p.getSetterValueType](setter.kind);

    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/channels/set`,
      'PUT',
      [[{ id: setter.id }, { [setterType]: value }]]
    );
  }

  /**
   * Call a service getter.
   *
   * @param {Object} selector
   * @return {Promise}
   */
  get(selector) {
    const getter = this[p.getChannel](this[p.getters], selector);
    const body = { id: getter.id };

    if (getter.kind.type === 'Binary') {
      return this[p.net].fetchBlob(
        `${this[p.net].origin}/api/v${this[p.settings].apiVersion}` +
        '/channels/get',
        // For now we only support JPEG blobs.
        'image/jpeg',
        'PUT',
        body
      );
    }

    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/channels/get`,
      'PUT',
      body
    )
      // We request getter value by unique getter id, so we can have only
      // results for this getter.
      .then((response) => response[getter.id]);
  }

  /**
   * @param {Object} channels
   * @param {Object|string} selector A value matching the kind of a channel.
   * @return {Object}
   */
  [p.getChannel](channels, selector) {
    let channelKey;

    if (selector.id) {
      channelKey = selector.id;
    } else if (selector.kind || typeof selector === 'string') {
      const channelKind = selector.kind || selector;

      channelKey = Object.keys(channels).find((key) => {
        const channel = channels[key];

        if (typeof channel.kind === 'object') {
          return channel.kind.kind === channelKind;
        }

        return channel.kind === channelKind;
      });
    }

    return channelKey ? channels[channelKey] : null;
  }

  /**
   * Returns value type string for the specified operation kind.
   *
   * @param {string|Object} operationKind Kind of the operation, string for the
   * well known type and object for the Extension channel kind.
   * @return {string}
   * @private
   */
  [p.getSetterValueType](operationKind) {
    if (!operationKind) {
      throw new Error('Operation kind is not defined.');
    }

    // Operation kind can be either object or string.
    if (typeof operationKind === 'object') {
      return operationKind.type;
    }

    switch (operationKind) {
      case 'TakeSnapshot':
        return 'Unit';
      case 'LightOn':
        return 'OnOff';
      default:
        return operationKind;
    }
  }
}
