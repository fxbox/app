'use strict';

// Private members.
const p = Object.freeze({
  // Private properties.
  settings: Symbol('settings'),
  local: Symbol('local'),
  remote: Symbol('remote'),
  pingInterval: Symbol('pingInterval'),

  // Private methods.
  fetch: Symbol('fetch'),
  ping: Symbol('ping'),
  pingBox: Symbol('pingBox')
});

export default class Network {
  constructor(settings) {
    // Private properties.
    this[p.settings] = settings;
    // Whether we can connect to the box via a local connection.
    this[p.local] = false;
    // Whether we can connect to the box via a remote connection.
    this[p.remote] = false;
    // A reference to the interval to get the online status.
    this[p.pingInterval] = null;

    Object.seal(this);
  }

  /**
   * Attach event listeners related to the connection status.
   *
   * @return {Promise}
   */
  init() {
    const pingBox = this[p.pingBox].bind(this);

    window.addEventListener('online', pingBox);
    window.addEventListener('offline', pingBox);

    if ('connection' in navigator && 'onchange' in navigator.connection) {
      navigator.connection.addEventListener('change', pingBox);

      // We also ping the box every few minutes to make sure it's still there.
      this[p.pingInterval] = setInterval(pingBox,
        this[p.settings].onlineCheckingLongInterval);
    } else {
      // If the Network Information API is not implemented, fallback to polling.
      this[p.pingInterval] = setInterval(pingBox,
        this[p.settings].onlineCheckingInterval);
    }

    this[p.pingBox]();

    return Promise.resolve();
  }

  get origin() {
    if (this[p.local]) {
      return this.localOrigin;
    } else if (this[p.remote]) {
      return this.tunnelOrigin;
    }

    console.error('The box is out of reach.');
    return this.localOrigin;
  }

  get localOrigin() {
    const settings = this[p.settings];

    return settings.localOrigin;
  }

  get tunnelOrigin() {
    const settings = this[p.settings];

    return settings.tunnelOrigin;
  }

  get connected() {
    return this[p.local] || this[p.remote];
  }

  get connection() {
    if (this[p.local]) {
      return 'local';
    } else if (this[p.remote]) {
      return 'remote';
    }
    return 'unknown';
  }

  /**
   * Request a JSON from a specified URL.
   *
   * @param {string} url The URL to send the request to.
   * @param {string} method The HTTP method (defaults to "GET").
   * @param {Object} body An object of key/value.
   * @return {Promise}
   */
  fetchJSON(url, method = 'GET', body = undefined) {
    return this[p.fetch](url, 'application/json', method, body)
      .then(response => response.json());
  }

  /**
   * Request a Blob from a specified URL.
   *
   * @param {string} url The URL to send the request to.
   * @param {string} blobType The Blob mime type (eg. image/jpeg).
   * @param {string} method The HTTP method (defaults to "GET").
   * @param {Object} body An object of key/value.
   * @return {Promise<Blob>}
   */
  fetchBlob(url, blobType, method, body) {
    return this[p.fetch](url, blobType, method, body)
      .then(response => response.blob());
  }

  /**
   * Request a content of the specified type from a specified URL.
   *
   * @todo Detect if the URL is relative, if so prepend this.origin.
   *
   * @param {string} url The URL to send the request to.
   * @param {string} accept The content mime type (eg. image/jpeg).
   * @param {string=} method The HTTP method (defaults to "GET").
   * @param {Object=} body An object of key/value.
   * @return {Promise}
   * @private
   */
  [p.fetch](url, accept, method = 'GET', body = undefined) {
    method = method.toUpperCase();

    const req = {
      method,
      headers: { Accept: accept },
      cache: 'no-store'
    };

    if (method === 'POST' || method === 'PUT') {
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
    }

    if (this[p.settings].session) {
      // The user is logged in, we authenticate the request.
      req.headers.Authorization = `Bearer ${this[p.settings].session}`;
    }

    if (body !== undefined) {
      req.body = JSON.stringify(body);
    }

    return fetch(url, req)
      .then(res => {
        if (!res.ok) {
          throw new TypeError(
            `The response returned a ${res.status} HTTP status code.`
          );
        }

        return res;
      })
      .catch(error => {
        console.error('Error occurred while fetching content: ', error);
        throw error;
      });
  }

  /**
   * Ping the box to detect whether we connect locally or remotely.
   *
   * @private
   */
  [p.pingBox]() {
    this[p.ping](`${this.localOrigin}/ping`)
      .then(() => {
        this[p.local] = true;
      })
      .catch(() => {
        this[p.local] = false;
      });

    // @todo Find a better way to detect if a tunnel connection is active.
    if (this[p.settings].tunnelOrigin !== '') {
      this[p.ping](`${this.tunnelOrigin}/ping`)
        .then(() => {
          this[p.remote] = true;
        })
        .catch(() => {
          this[p.remote] = false;
        });
    }
  }

  /**
   * Get a URL but don't process the response.
   *
   * @param {string} url The URL to send the request to.
   * @return {Promise}
   * @private
   */
  [p.ping](url) {
    return fetch(url, { cache: 'no-store' })
      .then(res => res.ok)
      .catch(error => {
        console.error('Error occurred while pinging content: ', error);
        throw error;
      });
  }
}
