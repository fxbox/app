'use strict';

import EventDispatcher from './common/event-dispatcher';
import SequentialTimer from './common/sequential-timer';

// Private members.
const p = Object.freeze({
  // Private properties.
  settings: Symbol('settings'),
  local: Symbol('local'),
  remote: Symbol('remote'),

  localPingTimer: Symbol('localPingTimer'),
  remotePingTimer: Symbol('remotePingTimer'),

  // Private methods.
  fetch: Symbol('fetch'),
  ping: Symbol('ping'),
  pingLocalBox: Symbol('pingLocalBox'),
  pingRemoteBox: Symbol('pingRemoteBox'),
  pingAllBoxes: Symbol('pingAllBoxes'),
  onPong: Symbol('onPong'),
});

export default class Network extends EventDispatcher {
  constructor(settings) {
    super(['online']);

    // Private properties.
    this[p.settings] = settings;
    // Whether we can connect to the box via a local connection.
    this[p.local] = false;
    // Whether we can connect to the box via a remote connection.
    this[p.remote] = false;

    this[p.localPingTimer] = null;
    this[p.remotePingTimer] = null;

    this[p.pingLocalBox] = this[p.pingLocalBox].bind(this);
    this[p.pingRemoteBox] = this[p.pingRemoteBox].bind(this);
    this[p.pingAllBoxes] = this[p.pingAllBoxes].bind(this);

    Object.seal(this);
  }

  /**
   * Attach event listeners related to the connection status.
   *
   * @return {Promise}
   */
  init() {
    window.addEventListener('online', this[p.pingAllBoxes]);
    window.addEventListener('offline', this[p.pingAllBoxes]);

    let pingInterval;
    if ('connection' in navigator && 'onchange' in navigator.connection) {
      navigator.connection.addEventListener('change', this[p.pingAllBoxes]);

      // We also ping the box every few minutes to make sure it's still there.
      pingInterval = this[p.settings].onlineCheckingLongInterval;
    } else {
      // If the Network Information API is not implemented, fallback to polling.
      pingInterval = this[p.settings].onlineCheckingInterval;
    }

    // @todo Settings should emit event when it changes "tunnelOrigin" or
    // "localOrigin" setting and we should listen for this change and start or
    // stop timers according to these settings.
    this[p.localPingTimer] = new SequentialTimer(pingInterval);
    this[p.localPingTimer].start(this[p.pingLocalBox]);

    this[p.remotePingTimer] = new SequentialTimer(pingInterval);
    this[p.remotePingTimer].start(this[p.pingRemoteBox]);

    this[p.pingAllBoxes]();

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
    return this[p.settings].localOrigin;
  }

  get tunnelOrigin() {
    return this[p.settings].tunnelOrigin;
  }

  get online() {
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
      .then((response) => response.json());
  }

  /**
   * Request a Blob from a specified URL.
   *
   * @param {string} url The URL to send the request to.
   * @param {string} blobType The Blob mime type (eg. image/jpeg).
   * @param {string=} method The HTTP method (defaults to "GET").
   * @param {Object=} body An object of key/value.
   * @return {Promise<Blob>}
   */
  fetchBlob(url, blobType, method, body) {
    return this[p.fetch](url, blobType, method, body)
      .then((response) => response.blob());
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
      cache: 'no-store',
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
      .then((res) => {
        if (!res.ok) {
          throw new TypeError(
            `The response returned a ${res.status} HTTP status code.`
          );
        }

        return res;
      })
      .catch((error) => {
        console.error('Error occurred while fetching content: ', error);
        throw error;
      });
  }

  /**
   * Ping the local box to detect whether it's still alive.
   *
   * @return {Promise}
   * @private
   */
  [p.pingLocalBox]() {
    // @todo Find a better way to detect if a local connection is active.
    if (!this[p.settings].localOrigin) {
      return Promise.resolve();
    }

    return this[p.ping](`${this.localOrigin}/ping`)
      .then((isOnline) => this[p.onPong](p.local, isOnline));
  }

  /**
   * Ping the remote box to detect whether it's still alive.
   *
   * @return {Promise}
   * @private
   */
  [p.pingRemoteBox]() {
    // @todo Find a better way to detect if a tunnel connection is active.
    if (!this[p.settings].tunnelOrigin) {
      return Promise.resolve();
    }

    return this[p.ping](`${this.tunnelOrigin}/ping`)
      .then((isOnline) => this[p.onPong](p.remote, isOnline));
  }

  /**
   * Pings both local and remote boxes simultaneously (if discovered).
   *
   * @private
   */
  [p.pingAllBoxes]() {
    this[p.pingLocalBox]();
    this[p.pingRemoteBox]();
  }

  /**
   * Performs HTTP 'GET' request to the specified URL. Returns 'true' if
   * response was successful (any of 200-299 status codes) or 'false'
   * otherwise.
   *
   * @param {string} url The URL to send the request to.
   * @return {Promise<boolean>}
   * @private
   */
  [p.ping](url) {
    return fetch(url, { cache: 'no-store' })
      .then((res) => res.ok)
      .catch((error) => {
        console.error('Error occurred while pinging content: %o', error);
        return false;
      });
  }

  /**
   * Process ping response (pong). If 'online' state is changed we emit 'online'
   * event. Since 'online' state depends on two factors: local and remote server
   * availability, there is a slight chance that this method will cause two
   * events e.g. if previously box was available only locally and now it's
   * available only remotely we'll likely generate event indicating that box
   * went offline following by another event indicating that box is online
   * again.
   *
   * @param {Symbol} localOrRemote Symbol indicating whether we process local
   * pong or remote one.
   * @param {boolean} isOnline Flag that indicates whether pinged server
   * successfully responded to ping request.
   * @private
   */
  [p.onPong](localOrRemote, isOnline) {
    // If value hasn't changed, there is no reason to think that overall
    // 'online' state has changed.
    if (this[localOrRemote] === isOnline) {
      return;
    }

    const previousOnlineState = this[p.local] || this[p.remote];

    this[localOrRemote] = isOnline;

    const currentOnlineState = this[p.local] || this[p.remote];
    if (previousOnlineState !== currentOnlineState) {
      this.emit('online', currentOnlineState);
    }
  }
}
