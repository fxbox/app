'use strict';

import { Model } from 'components/fxos-mvc/dist/mvc';

const DEFAULT_SCHEME = 'http';
const DEFAULT_HOSTNAME = 'localhost';
const DEFAULT_PORT = 3000;

export default class FoxboxSettings extends Model {
  constructor() {
    super({
      _scheme: localStorage.getItem('foxbox-scheme') || DEFAULT_SCHEME,
      _hostname: localStorage.getItem('foxbox-hostname') || DEFAULT_HOSTNAME,
      _port: localStorage.getItem('foxbox-port') || DEFAULT_PORT,
      _session: localStorage.getItem('session')
    });
  }

  get scheme() {
    return this._scheme;
  }

  set scheme(scheme) {
    scheme = String(scheme) || DEFAULT_SCHEME;
    this._scheme = scheme;
    localStorage.setItem('foxbox-scheme', this._scheme);
  }

  get hostname() {
    return this._hostname;
  }

  set hostname(hostname) {
    hostname = String(hostname) || DEFAULT_HOSTNAME;
    this._hostname = hostname.replace(/\/$/, ''); // Trailing slash.
    localStorage.setItem('foxbox-hostname', this._hostname);
  }

  get port() {
    return this._port;
  }

  set port(port) {
    port = parseInt(port, 10) || DEFAULT_PORT;
    this._port = port;
    localStorage.setItem('foxbox-port', this._port);
  }

  get session() {
    return this._session;
  }

  set session(session) {
    if (session === undefined) {
      this._session = undefined;
      localStorage.removeItem('session');
    } else {
      this._session = session;
      localStorage.setItem('session', this._session);
    }
  }
}
