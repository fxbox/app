'use strict';

import EventDispatcher from './common/event-dispatcher';
import SequentialTimer from './common/sequential-timer';

// Private members.
const p = Object.freeze({
  // Private properties.
  origin: Symbol('origin'),
  online: Symbol('online'),
  lastSeenOnline: Symbol('lastSeenOnline'),

  pingTimer: Symbol('pingTimer'),

  // Private methods.
  ping: Symbol('ping'),
});

export default class BoxLink extends EventDispatcher {
  constructor(origin) {
    super(['online']);

    if (!origin) {
      throw new Error('Origin should be valid non-empty string.');
    }

    this[p.ping] = this[p.ping].bind(this);

    this[p.origin] = origin;
    this[p.online] = false;
    this[p.lastSeenOnline] = 0;
    this[p.pingTimer] = new SequentialTimer(Number.POSITIVE_INFINITY);

    Object.seal(this);
  }

  get origin() {
    return this[p.origin];
  }

  get online() {
    return this[p.online];
  }

  /**
   * Marks current box link as online. Method is called by the consumer to
   * indicate that box has been seen online by other means than ping itself.
   */
  seenOnline() {
    this[p.online] = true;
    this[p.lastSeenOnline] = Date.now();
  }

  /**
   * Enables automatic box link ping using specified interval.
   *
   * @param {number} interval Minimum interval that should be kept between two
   * consequent ping requests.
   */
  enableAutoPing(interval) {
    if (typeof interval !== 'number' || interval < 0) {
      throw new Error('Interval should valid positive number.');
    }

    this[p.pingTimer].interval = interval;
    if (!this[p.pingTimer].started) {
      this[p.pingTimer].start(this[p.ping]);
    }
  }

  /**
   * Disables automatic box link ping.
   */
  disableAutoPing() {
    if (!this[p.pingTimer].started) {
      return;
    }

    this[p.pingTimer].stop();
  }

  /**
   * Pings box link. Ping will be made immediately. Return promise will be
   * resolved into boolean that indicates whether box link online or not.
   *
   * @return {Promise<boolean>}
   */
  ping() {
    return this[p.ping](true /* force ping */);
  }

  /**
   * Performs HTTP 'GET' request link's "ping" endpoint. Returns 'true' if
   * response was successful (any of 200-299 status codes) or 'false'
   * otherwise.
   *
   * @param {boolean} force Indicates that we should perform ping request even
   * if the box was pinged recently.
   * @return {Promise<boolean>}
   * @private
   */
  [p.ping](force) {
    // If ping is not forced and box link was seen online recently, we don't
    // have to ping it again.
    const seenOnlineRecently = Date.now() - this[p.lastSeenOnline] <
      this[p.pingTimer].interval;
    if (!force && (seenOnlineRecently || document.hidden)) {
      return Promise.resolve();
    }

    return fetch(`${this[p.origin]}/ping`, { cache: 'no-store' })
      .then(
        (res) => res.ok,
        (error) => {
          console.error('Error occurred while pinging box: %o', error);
          return false;
        })
      .then((isOnline) => {
        if (isOnline) {
          this[p.lastSeenOnline] = Date.now();
        }

        if (this[p.online] === isOnline) {
          return;
        }

        this[p.online] = isOnline;
        this.emit('online', isOnline);

        return isOnline;
      });
  }
}
