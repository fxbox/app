'use strict';

import EventDispatcher from './common/event-dispatcher';

// Prefix all entries to avoid collisions.
const PREFIX = 'foxbox-';

/**
 * API version to use (currently not configurable).
 * @type {number}
 * @const
 */
const API_VERSION = 1;

/**
 * Name of the query string parameter that should be presented in URLs pointing
 * to box endpoints (eg. streams, event sources etc.) if authorisation HTTP
 * header can't be attached.
 * @type {string}
 * @const
 */
const QUERY_STRING_AUTH_TOKEN_NAME = 'auth';

/**
 * Regex to match upper case literals.
 * @type {RegExp}
 * @const
 */
const UPPER_CASE_REGEX = /([A-Z])/g;

const p = Object.freeze({
  values: Symbol('values'),
  storage: Symbol('storage'),

  // Private methods.
  updateSetting: Symbol('updateSetting'),
  stringToSettingTypedValue: Symbol('stringToSettingTypedValue'),
  getDefaultSettingValue: Symbol('getDefaultSettingValue'),
  onStorage: Symbol('onStorage'),
});

// Definition of all available settings and their default values (if needed).
const settings = Object.freeze({
  // Boolean settings.
  CONFIGURED: Object.freeze({ key: 'configured', type: 'boolean' }),
  SKIP_DISCOVERY: Object.freeze({ key: 'skipDiscovery', type: 'boolean' }),
  SERVICE_POLLING_ENABLED: Object.freeze({
    key: 'servicePollingEnabled',
    type: 'boolean',
    defaultValue: true,
  }),

  // Number settings.
  SERVICE_POLLING_INTERVAL: Object.freeze({
    key: 'servicePollingInterval',
    type: 'number',
    defaultValue: 2000,
  }),
  WATCH_INTERVAL: Object.freeze({
    key: 'watchInterval',
    type: 'number',
    defaultValue: 3000,
  }),
  ONLINE_CHECKING_INTERVAL: Object.freeze({
    key: 'onlineCheckingInterval',
    type: 'number',
    defaultValue: 5000,
  }),
  ONLINE_CHECKING_LONG_INTERVAL: Object.freeze({
    key: 'onlineCheckingLongInterval',
    type: 'number',
    defaultValue: 1000 * 60 * 5,
  }),

  // String settings.
  LOCAL_ORIGIN: Object.freeze({ key: 'localOrigin' }),
  TUNNEL_ORIGIN: Object.freeze({ key: 'tunnelOrigin' }),
  CLIENT: Object.freeze({ key: 'client' }),
  SESSION: Object.freeze({ key: 'session' }),
  PUSH_ENDPOINT: Object.freeze({ key: 'pushEndpoint' }),
  PUSH_PUB_KEY: Object.freeze({ key: 'pushPubKey' }),
  PUSH_AUTH: Object.freeze({ key: 'pushAuth' }),
  REGISTRATION_SERVICE: Object.freeze({
    key: 'registrationService',
    defaultValue: 'https://knilxof.org:4443/ping',
  }),
});

export default class Settings extends EventDispatcher {
  constructor(storage = localStorage) {
    super();

    // Not all browsers have localStorage supported or activated.
    this[p.storage] = storage || {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };

    this[p.values] = new Map();

    Object.keys(settings).forEach((settingName) => {
      const setting = settings[settingName];
      const settingStringValue = this[p.storage].getItem(
        `${PREFIX}${setting.key}`
      );

      // Setting values directly to avoid firing events on startup.
      this[p.values].set(
        setting,
        this[p.stringToSettingTypedValue](setting, settingStringValue)
      );
    });

    window.addEventListener('storage', this[p.onStorage].bind(this));

    Object.seal(this);
  }

  get configured() {
    return this[p.values].get(settings.CONFIGURED);
  }

  set configured(value) {
    this[p.updateSetting](settings.CONFIGURED, value);
  }

  get localOrigin() {
    return this[p.values].get(settings.LOCAL_ORIGIN);
  }

  set localOrigin(value) {
    this[p.updateSetting](
      settings.LOCAL_ORIGIN,
      value ? (new URL(value)).origin : null
    );
  }

  get tunnelOrigin() {
    return this[p.values].get(settings.TUNNEL_ORIGIN);
  }

  set tunnelOrigin(value) {
    this[p.updateSetting](
      settings.TUNNEL_ORIGIN,
      value ? (new URL(value)).origin : null
    );
  }

  get client() {
    return this[p.values].get(settings.CLIENT);
  }

  set client(value) {
    this[p.updateSetting](settings.CLIENT, value ? String(value) : null);
  }

  get session() {
    return this[p.values].get(settings.SESSION);
  }

  set session(value) {
    this[p.updateSetting](settings.SESSION, value);
  }

  get skipDiscovery() {
    return this[p.values].get(settings.SKIP_DISCOVERY);
  }

  set skipDiscovery(value) {
    this[p.updateSetting](settings.SKIP_DISCOVERY, value);
  }

  get servicePollingEnabled() {
    return this[p.values].get(settings.SERVICE_POLLING_ENABLED);
  }

  set servicePollingEnabled(value) {
    this[p.updateSetting](settings.SERVICE_POLLING_ENABLED, value);
  }

  get pushEndpoint() {
    return this[p.values].get(settings.PUSH_ENDPOINT);
  }

  set pushEndpoint(value) {
    this[p.updateSetting](settings.PUSH_ENDPOINT, value);
  }

  get pushPubKey() {
    return this[p.values].get(settings.PUSH_PUB_KEY);
  }

  set pushPubKey(value) {
    this[p.updateSetting](settings.PUSH_PUB_KEY, value);
  }

  get pushAuth() {
    return this[p.values].get(settings.PUSH_AUTH);
  }

  set pushAuth(value) {
    this[p.updateSetting](settings.PUSH_AUTH, value);
  }

  // Getters only.
  get registrationService() {
    return this[p.values].get(settings.REGISTRATION_SERVICE);
  }

  get servicePollingInterval() {
    return this[p.values].get(settings.SERVICE_POLLING_INTERVAL);
  }

  get onlineCheckingInterval() {
    return this[p.values].get(settings.ONLINE_CHECKING_INTERVAL);
  }

  get onlineCheckingLongInterval() {
    return this[p.values].get(settings.ONLINE_CHECKING_LONG_INTERVAL);
  }

  /**
   * Minimal interval between consequent value watcher requests.
   * @return {number}
   */
  get watchInterval() {
    return this[p.values].get(settings.WATCH_INTERVAL);
  }

  get queryStringAuthTokenName() {
    return QUERY_STRING_AUTH_TOKEN_NAME;
  }

  get apiVersion() {
    return API_VERSION;
  }

  /**
   * Iterates through all known settings and sets default value for all of them.
   *
   * @return {Promise}
   */
  clear() {
    return new Promise((resolve) => {
      Object.keys(settings).forEach((settingName) => {
        const setting = settings[settingName];
        this[p.updateSetting](setting, this[p.getDefaultSettingValue](setting));
      });
      resolve();
    });
  }

  /**
   * Tries to update setting with new value. If value has changed corresponding
   * event will be emitted. New value is also persisted to the local storage.
   *
   * @param {Object} setting Setting description object.
   * @param {number|boolean|string?} newValue New value for specified setting.
   * @private
   */
  [p.updateSetting](setting, newValue) {
    const currentValue = this[p.values].get(setting);
    if (currentValue === newValue) {
      return;
    }

    this[p.values].set(setting, newValue);

    if (newValue !== this[p.getDefaultSettingValue](setting)) {
      this[p.storage].setItem(`${PREFIX}${setting.key}`, newValue);
    } else {
      this[p.storage].removeItem(`${PREFIX}${setting.key}`);
    }

    this.emit(
      setting.key.replace(UPPER_CASE_REGEX, (part) => `-${part.toLowerCase()}`),
      newValue
    );
  }

  /**
   * Converts setting raw string value to the typed one depending on the setting
   * type.
   *
   * @param {Object} setting Setting description object.
   * @param {string?} stringValue Raw string setting value or null.
   * @return {number|boolean|string|null}
   * @private
   */
  [p.stringToSettingTypedValue](setting, stringValue) {
    // If string is null, we should return default value for this setting or
    // default value for setting type.
    if (stringValue === null) {
      return this[p.getDefaultSettingValue](setting);
    } else if (setting.type === 'boolean') {
      return stringValue === 'true';
    } else if (setting.type === 'number') {
      return Number(stringValue);
    }

    return stringValue;
  }

  /**
   * Gets default typed value for the specified setting.
   *
   * @param {Object} setting Setting description object.
   * @return {number|boolean|string|null}
   * @private
   */
  [p.getDefaultSettingValue](setting) {
    if (setting.defaultValue !== undefined) {
      return setting.defaultValue;
    }

    // Default value for this setting is not specified, let's return default
    // value for setting type (boolean, number or string).
    if (setting.type === 'boolean') {
      return false;
    } else if (setting.type === 'number') {
      return 0;
    }

    return null;
  }

  /**
   * Handles localStorage "storage" event.
   *
   * @param {StorageEvent} evt StorageEvent instance.
   * @private
   */
  [p.onStorage](evt) {
    if (!evt.key.startsWith(PREFIX)) {
      return;
    }

    const key = evt.key.substring(PREFIX.length);
    const settingName = Object.keys(settings).find((settingName) => {
      return settings[settingName].key === key;
    });

    if (!settingName) {
      console.warn(
        `Changed unknown storage entry with app specific prefix: ${evt.key}`
      );
      return;
    }

    const setting = settings[settingName];

    this[p.updateSetting](
      setting,
      this[p.stringToSettingTypedValue](setting, evt.newValue)
    );
  }
}
