'use strict';

import { Model } from 'components/fxos-mvc/dist/mvc';

// Prefix all entries to avoid collisions.
const PREFIX = 'foxbox-';

const DEFAULT_SCHEME = 'http';
const DEFAULT_HOSTNAME = 'localhost';
const DEFAULT_PORT = 3000;
const REGISTRATION_SERVICE = 'http://knilxof.org:4242/ping';

export default class FoxboxSettings extends Model {
  constructor() {
    super({
      _scheme: localStorage.getItem(`${PREFIX}scheme`) || DEFAULT_SCHEME,
      _hostname: localStorage.getItem(`${PREFIX}hostname`) || DEFAULT_HOSTNAME,
      _port: localStorage.getItem(`${PREFIX}port`) || DEFAULT_PORT,
      _session: localStorage.getItem(`${PREFIX}session`),
      _skipDiscovery: localStorage.getItem(`${PREFIX}skipDiscovery`) === 'true'
    });
  }

  get scheme() {
    return this._scheme;
  }

  set scheme(scheme) {
    scheme = String(scheme) || DEFAULT_SCHEME;
    this._scheme = scheme;
    localStorage.setItem(`${PREFIX}scheme`, this._scheme);
  }

  get hostname() {
    return this._hostname;
  }

  set hostname(hostname) {
    hostname = String(hostname) || DEFAULT_HOSTNAME;
    this._hostname = hostname.replace(/\/$/, ''); // Trailing slash.
    localStorage.setItem(`${PREFIX}hostname`, this._hostname);
  }

  get port() {
    return this._port;
  }

  set port(port) {
    port = parseInt(port, 10) || DEFAULT_PORT;
    this._port = port;
    localStorage.setItem(`${PREFIX}port`, this._port);
  }

  get session() {
    return this._session;
  }

  set session(session) {
    if (session === undefined) {
      this._session = undefined;
      localStorage.removeItem(`${PREFIX}session`);
    } else {
      this._session = session;
      localStorage.setItem(`${PREFIX}session`, this._session);
    }
  }

  get registrationService() {
    return REGISTRATION_SERVICE;
  }

  get skipDiscovery() {
    return this._skipDiscovery;
  }

  set skipDiscovery(value) {
    value = !!value;
    this._skipDiscovery = value;
    localStorage.setItem(`${PREFIX}skipDiscovery`, value);
  }
}
