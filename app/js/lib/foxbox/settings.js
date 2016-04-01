'use strict';

import { Model } from 'components/fxos-mvc/dist/mvc';

// Prefix all entries to avoid collisions.
const PREFIX = 'foxbox-';

const DEFAULT_SCHEME = 'http';
const DEFAULT_HOSTNAME = 'localhost';
const DEFAULT_PORT = 3000;
const DEFAULT_POLLING_ENABLED = true;
const POLLING_INTERVAL = 2000;
const ONLINE_CHECKING_INTERVAL = 5000;
const ONLINE_CHECKING_LONG_INTERVAL = 1000 * 60 * 5;
const REGISTRATION_SERVICE = 'http://knilxof.org:4242/ping';
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
  removeItem: () => {}
};

export default class Settings extends Model {
  constructor() {
    super({
      _configured: storage.getItem(`${PREFIX}configured`) !== null ?
      storage.getItem(`${PREFIX}configured`) === 'true' : false,

      _localScheme: storage.getItem(`${PREFIX}localScheme`) || DEFAULT_SCHEME,
      _localHostname: storage.getItem(`${PREFIX}localHostname`) || DEFAULT_HOSTNAME,
      _localPort: storage.getItem(`${PREFIX}localPort`) || DEFAULT_PORT,

      _tunnelScheme: storage.getItem(`${PREFIX}tunnelScheme`) || DEFAULT_SCHEME,
      _tunnelHostname: storage.getItem(`${PREFIX}tunnelHostname`) || '',
      _tunnelPort: storage.getItem(`${PREFIX}tunnelPort`) || DEFAULT_PORT,

      _session: storage.getItem(`${PREFIX}session`),
      _skipDiscovery: storage.getItem(`${PREFIX}skipDiscovery`) === 'true',
      _pollingEnabled: storage.getItem(`${PREFIX}pollingEnabled`) !== null ?
      storage.getItem(`${PREFIX}pollingEnabled`) === 'true' : DEFAULT_POLLING_ENABLED
    });
  }

  clear() {
    return new Promise(resolve => {
      // @todo Remove only the items set here.
      storage.clear();
      resolve();
    });
  }

  on(property, handler) {
    const prototype = Object.getPrototypeOf(this);
    const parent = Object.getPrototypeOf(prototype);

    parent.on.call(this, `_${property}`, handler);
  }

  get configured() {
    return this._configured;
  }

  set configured(value) {
    value = !!value;
    this._configured = value;
    storage.setItem(`${PREFIX}configured`, value);
  }

  get localScheme() {
    return this._localScheme;
  }

  set localScheme(scheme) {
    scheme = String(scheme) || DEFAULT_SCHEME;
    this._localScheme = scheme;
    storage.setItem(`${PREFIX}localScheme`, this._localScheme);
  }

  get localHostname() {
    return this._localHostname;
  }

  set localHostname(hostname) {
    hostname = String(hostname) || DEFAULT_HOSTNAME;
    this._localHostname = hostname.replace(/\/$/, ''); // Trailing slash.
    storage.setItem(`${PREFIX}localHostname`, this._localHostname);
  }

  get localPort() {
    return this._localPort;
  }

  set localPort(port) {
    port = parseInt(port, 10) || DEFAULT_PORT;
    this._localPort = port;
    storage.setItem(`${PREFIX}localPort`, this._localPort);
  }

  get tunnelScheme() {
    return this._tunnelScheme;
  }

  set tunnelScheme(scheme) {
    scheme = String(scheme) || DEFAULT_SCHEME;
    this._tunnelScheme = scheme;
    storage.setItem(`${PREFIX}tunnelScheme`, this._tunnelScheme);
  }

  get tunnelHostname() {
    return this._tunnelHostname;
  }

  set tunnelHostname(hostname) {
    hostname = String(hostname) || DEFAULT_HOSTNAME;
    this._tunnelHostname = hostname.replace(/\/$/, ''); // Trailing slash.
    storage.setItem(`${PREFIX}tunnelHostname`, this._tunnelHostname);
  }

  get tunnelPort() {
    return this._tunnelPort;
  }

  set tunnelPort(port) {
    port = parseInt(port, 10) || DEFAULT_PORT;
    this._tunnelPort = port;
    storage.setItem(`${PREFIX}tunnelPort`, this._tunnelPort);
  }

  get session() {
    return this._session;
  }

  set session(session) {
    if (session === undefined) {
      this._session = undefined;
      storage.removeItem(`${PREFIX}session`);
    } else {
      this._session = session;
      storage.setItem(`${PREFIX}session`, this._session);
    }
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
    value = !!value;
    this._pollingEnabled = value;
    storage.setItem(`${PREFIX}pollingEnabled`, value);
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
