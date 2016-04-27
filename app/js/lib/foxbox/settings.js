'use strict';

import EventDispatcher from './event-dispatcher';

// Prefix all entries to avoid collisions.
const PREFIX = 'foxbox-';

const DEFAULT_POLLING_ENABLED = true;
const POLLING_INTERVAL = 2000;
const ONLINE_CHECKING_INTERVAL = 5000;
const ONLINE_CHECKING_LONG_INTERVAL = 1000 * 60 * 5;
const REGISTRATION_SERVICE = 'https://knilxof.org:4443/ping';
const API_VERSION = 1;

/**
 * Name of the query string parameter that should be presented in URLs pointing
 * to box endpoints (eg. streams, event sources etc.) if authorisation HTTP
 * header can't be attached.
 * @type {string}
 * @const
 */
const QUERY_STRING_AUTH_TOKEN_NAME = 'auth';

// Not all browsers have localStorage supported or activated.
const storage = localStorage ? localStorage : {
  getItem: () => undefined,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

export default class Settings extends EventDispatcher {
  constructor() {
    super(['session', 'polling-setting']);

    const localOrigin = storage.getItem(`${PREFIX}localOrigin`);

    const pollingEnabled = storage.getItem(`${PREFIX}pollingEnabled`) !== null ?
      storage.getItem(`${PREFIX}pollingEnabled`) === 'true' :
      DEFAULT_POLLING_ENABLED;

    this._configured = storage.getItem(`${PREFIX}configured`) !== null ?
      storage.getItem(`${PREFIX}configured`) === 'true' : false;
    this._localOrigin = localOrigin;
    this._tunnelOrigin = storage.getItem(`${PREFIX}tunnelOrigin`) || '';
    this._client = storage.getItem(`${PREFIX}client`) || '';
    this._session = storage.getItem(`${PREFIX}session`);
    this._skipDiscovery = storage.getItem(`${PREFIX}skipDiscovery`) === 'true';
    this._pollingEnabled = pollingEnabled;
    this._pushEndpoint = storage.getItem(`${PREFIX}push_endpoint`) || null;
    this._pushPubKey = storage.getItem(`${PREFIX}push_pubKey`) || null;
  }

  clear() {
    return new Promise((resolve) => {
      // @todo Remove only the items set here.
      storage.clear();
      this._session = null;

      resolve();
    });
  }

  get configured() {
    return this._configured;
  }

  set configured(value) {
    value = !!value;
    this._configured = value;
    storage.setItem(`${PREFIX}configured`, value);
  }

  get localOrigin() {
    return this._localOrigin;
  }

  set localOrigin(origin) {
    this._localOrigin = origin ? (new URL(origin)).origin : null;
    if (this._localOrigin) {
      storage.setItem(`${PREFIX}localOrigin`, this._localOrigin);
    } else {
      storage.removeItem(`${PREFIX}localOrigin`);
    }
  }

  get tunnelOrigin() {
    return this._tunnelOrigin;
  }

  set tunnelOrigin(origin) {
    this._tunnelOrigin = origin ? (new URL(origin)).origin : null;
    if (this._tunnelOrigin) {
      storage.setItem(`${PREFIX}tunnelOrigin`, this._tunnelOrigin);
    } else {
      storage.removeItem(`${PREFIX}tunnelOrigin`);
    }
  }

  get client() {
    return this._client;
  }

  set client(id) {
    this._client = String(id);
    storage.setItem(`${PREFIX}client`, this._client);
  }

  get session() {
    return this._session;
  }

  set session(session) {
    if (this._session === session) {
      return;
    }

    this._session = session;

    if (this._session) {
      storage.setItem(`${PREFIX}session`, this._session);
    } else {
      storage.removeItem(`${PREFIX}session`);
    }

    this.emit('session');
  }

  get skipDiscovery() {
    return this._skipDiscovery;
  }

  set skipDiscovery(value) {
    value = !!value;
    this._skipDiscovery = value;
    storage.setItem(`${PREFIX}skipDiscovery`, value);
  }

  get pollingEnabled() {
    return this._pollingEnabled;
  }

  set pollingEnabled(value) {
    if (value === this._pollingEnabled) {
      return;
    }

    this._pollingEnabled = value;
    storage.setItem(`${PREFIX}pollingEnabled`, value);

    this.emit('polling-setting');
  }

  get pushEndpoint() {
    return this._pushEndpoint;
  }

  set pushEndpoint(value) {
    this._pushEndpoint = value;
    storage.setItem(`${PREFIX}push_endpoint`, value);
  }

  get pushPubKey() {
    return this._pushPubKey;
  }

  set pushPubKey(value) {
    this._pushPubKey = value;
    storage.setItem(`${PREFIX}push_pubKey`, value);
  }

  // Getters only.
  get registrationService() {
    return localStorage.registrationServer ||
      REGISTRATION_SERVICE;
  }

  get pollingInterval() {
    return POLLING_INTERVAL;
  }

  get onlineCheckingInterval() {
    return ONLINE_CHECKING_INTERVAL;
  }

  get onlineCheckingLongInterval() {
    return ONLINE_CHECKING_LONG_INTERVAL;
  }

  get queryStringAuthTokenName() {
    return QUERY_STRING_AUTH_TOKEN_NAME;
  }

  get apiVersion() {
    return API_VERSION;
  }
}
