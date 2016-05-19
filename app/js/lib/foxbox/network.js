'use strict';

import EventDispatcher from './common/event-dispatcher';
import BoxLink from './box-link';

const p = Object.freeze({
  // Private properties.
  settings: Symbol('settings'),

  localLink: Symbol('localLink'),
  tunnelLink: Symbol('tunnelLink'),
  linkPingInterval: Symbol('linkPingInterval'),
  online: Symbol('online'),

  // Private methods.
  fetch: Symbol('fetch'),
  pingLinks: Symbol('pingLinks'),
  updateLink: Symbol('updateLink'),
  onLinkOnlineChange: Symbol('onLinkOnlineChange'),
  onLinkOriginChange: Symbol('onLinkOriginChange'),
});

export default class Network extends EventDispatcher {
  constructor(settings) {
    super(['online']);

    this[p.settings] = settings;
    // Local box link that allows to connect to the box via local connection.
    this[p.localLink] = null;
    // Tunnel box link that allows to connect to the box via tunnel connection.
    this[p.tunnelLink] = null;
    this[p.linkPingInterval] = null;
    this[p.online] = false;

    this[p.pingLinks] = this[p.pingLinks].bind(this);
    this[p.onLinkOnlineChange] = this[p.onLinkOnlineChange].bind(this);
    this[p.onLinkOriginChange] = this[p.onLinkOriginChange].bind(this);

    Object.seal(this);
  }

  /**
   * Attach event listeners related to the connection status.
   *
   * @return {Promise}
   */
  init() {
    window.addEventListener('online', this[p.pingLinks]);
    window.addEventListener('offline', this[p.pingLinks]);

    if ('connection' in navigator && 'onchange' in navigator.connection) {
      navigator.connection.addEventListener('change', this[p.pingLinks]);

      // We also ping the box every few minutes to make sure it's still there.
      this[p.linkPingInterval] = this[p.settings].onlineCheckingLongInterval;
    } else {
      // If the Network Information API is not implemented, fallback to polling.
      this[p.linkPingInterval] = this[p.settings].onlineCheckingInterval;
    }

    this[p.settings].on('local-origin', this[p.onLinkOriginChange]);
    this[p.settings].on('tunnel-origin', this[p.onLinkOriginChange]);

    this[p.onLinkOriginChange]();

    return Promise.resolve();
  }

  get origin() {
    if (this[p.localLink]) {
      return this[p.localLink].origin;
    } else if (this[p.tunnelLink]) {
      return this[p.tunnelLink].origin;
    }

    throw new Error('Origin is not accessible');
  }

  get localOrigin() {
    return this[p.settings].localOrigin;
  }

  get tunnelOrigin() {
    return this[p.settings].tunnelOrigin;
  }

  get online() {
    return this[p.online];
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

        // Let's check if request has been made to any of existing box links,
        // in this case we can mark it as online eliminating redundant ping
        // request.
        const requestOrigin = (new URL(url)).origin;
        if (this[p.localLink] && this[p.localLink].origin === requestOrigin) {
          this[p.localLink].seenOnline();
        } else if (this[p.tunnelLink] &&
                   this[p.tunnelLink].origin === requestOrigin) {
          this[p.tunnelLink].seenOnline();
        }

        return res;
      })
      .catch((error) => {
        console.error('Error occurred while fetching content: ', error);
        throw error;
      });
  }

  /**
   * Pings both local and tunnel box links simultaneously (if discovered).
   *
   * @private
   */
  [p.pingLinks]() {
    if (this[p.localLink]) {
      this[p.localLink].ping();
    }

    if (this[p.tunnelLink]) {
      this[p.tunnelLink].ping();
    }
  }

  /**
   * Updates specified link. Link is updated if origin has changed, if origin
   * became "null" link will be deleted.
   *
   * @param {Symbol} symbol Symbol associated either with local or tunnel link.
   * @param {string?} origin Origin string, if "null" - origin is not available
   * anymore.
   * @private
   */
  [p.updateLink](symbol, origin) {
    const link = this[symbol];

    // Update is not required if we have neither origin nor link for it or if
    // existing link's origin isn't changed.
    if ((!origin && !link) || (link && link.origin === origin)) {
      return;
    }

    // Let's destroy old link if origin is changed or not available anymore.
    if (link) {
      link.off('online', this[p.onLinkOnlineChange]);
      link.disableAutoPing();
      this[symbol] = null;
    }

    if (origin) {
      this[symbol] = new BoxLink(origin);
      this[symbol].enableAutoPing(this[p.linkPingInterval]);
      this[symbol].on('online', this[p.onLinkOnlineChange]);
      // Ping box link immediately once it's created to get "online" status as
      // soon as possible.
      this[symbol].ping();
    }

    // It doesn't matter whether link has been added or removed we should try to
    // update "online" status.
    this[p.onLinkOnlineChange]();
  }

  /**
   * Updates box links whenever local or tunnel origin has changed.
   *
   * @private
   */
  [p.onLinkOriginChange]() {
    this[p.updateLink](p.localLink, this.localOrigin);
    this[p.updateLink](p.tunnelLink, this.tunnelOrigin);
  }

  /**
   * Updates overall "online" status whenever either local or tunnel link
   * "online" status has changed. If overall status has changed "online" event
   * is emitted.
   *
   * @private
   */
  [p.onLinkOnlineChange]() {
    const onlineStatus = !!this[p.localLink] && this[p.localLink].online ||
      !!this[p.tunnelLink] && this[p.tunnelLink].online;

    if (this[p.online] !== onlineStatus) {
      this[p.online] = onlineStatus;
      this.emit('online', onlineStatus);
    }
  }
}
