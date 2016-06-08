/* global URLSearchParams */

'use strict';

import EventDispatcher from './common/event-dispatcher';

import Settings from './settings';
import Db from './db';
import Network from './network';
import Recipes from './recipes';
import WebPush from './webpush';
import Services from './services';
import API from './api';

// Private members.
const p = Object.freeze({
  // Private properties.
  settings: Symbol('settings'),
  db: Symbol('db'),
  net: Symbol('net'),
  boxes: Symbol('boxes'),
  webPush: Symbol('webPush'),
  api: Symbol('api'),
});

export default class Foxbox extends EventDispatcher {
  constructor({ settings, db, net } = {}) {
    super(['push-message', 'online', 'discovery']);

    // Private properties.
    this[p.settings] = settings || new Settings();
    this[p.db] = db || new Db();
    this[p.net] = net || new Network(this[p.settings]);
    this[p.boxes] = Object.freeze([]);
    this[p.api] = new API(this[p.net], this[p.settings]);
    this[p.webPush] = new WebPush(this[p.api], this[p.settings]);

    this.services = new Services(this[p.db], this[p.api], this[p.settings]);
    this.recipes = new Recipes(this[p.api]);

    Object.seal(this);
  }

  init() {
    window.foxbox = this;

    this[p.net].on('online', (online) => this.emit('online', online));

    this[p.webPush].on('message', (msg) => this.emit('push-message', msg));

    // No need to block the UI on the discovery process.
    // Once we discover a box we can connect to, we will start
    // polling and triggering box-online events with a boolean
    // indicating if we have access to box or not.
    this._initDiscovery()
      .then(() => this[p.net].init());

    return this._initUserSession()
      // The DB is only initialised if there's no redirection to the box.
      .then(() => this[p.db].init());
  }

  /**
   * Clear all data/settings stored on the browser. Use with caution.
   *
   * @param {boolean} ignoreServiceWorker
   * @return {Promise}
   */
  clear(ignoreServiceWorker) {
    const promises = [this[p.settings].clear(), this[p.db].clear()];
    if (!navigator.serviceWorker) {
      return Promise.all(promises);
    }

    if (!ignoreServiceWorker) {
      promises.push(navigator.serviceWorker.ready
        .then((registration) => registration.unregister()));
    }

    return Promise.all(promises);
  }

  get online() {
    return this[p.net].online;
  }

  get client() {
    return this[p.settings].client;
  }

  get boxes() {
    return this[p.boxes];
  }

  /**
   * Get the URL of the box using the registration server.
   * If it fails, we fallback to the previously set hostname.
   * It there isn't, we schedule a retry.
   *
   * @return {Promise}
   * @private
   */
  _initDiscovery() {
    // For development purposes if you want to skip the
    // discovery phase set the 'foxbox-skipDiscovery' variable to
    // 'true'.
    if (this[p.settings].skipDiscovery) {
      return Promise.resolve();
    }

    return this[p.net].fetchJSON(this[p.settings].registrationService)
      .then((boxes) => {
        if (!Array.isArray(boxes)) {
          console.warn('Got unexpected response from registry server', boxes);
          return;
        }

        // We filter out boxes registered more than 2 minutes ago.
        const now = Math.floor(Date.now() / 1000) - 60 * 2;
        this[p.boxes] = Object.freeze(
          boxes
            .filter((box) => box.timestamp - now >= 0)
            .map((box) => {
              // NOTE(sgiles): There is consideration to allow
              // only "local_origin" and "tunnel_origin", removing the
              // need to parse message - this merges the relevant message
              // fields into the main object
              const { local_origin, tunnel_origin } = JSON.parse(box.message);
              const client = box.client;

              return Object.freeze({ local_origin, tunnel_origin, client });
            })
        );

        // Fire event every time registration server returns a valid response.
        // @todo We should improve this logic and check if boxes list has
        // actually changed and if so only then override internal box list and
        // fire event.
        this.emit('discovery');

        // If the registration server didn't give us any info and
        // we have no record of previous registrations, we schedule
        // a retry.
        if (!this[p.boxes].length &&
            !this[p.settings].localOrigin &&
            !this[p.settings].tunnelOrigin) {
          throw new Error('Registration service did not return any boxes.');
        }

        if (!this[p.settings].configured && this[p.boxes].length === 1) {
          this.selectBox();
        }
      })
      .catch((error) => {
        if (this[p.settings].localOrigin || this[p.settings].tunnelOrigin) {
          // Default to a previously stored box registration.
          return;
        }

        // If there's no previously stored box registration, we schedule a
        // retry.
        console.warn('Retrying box discovery... Reason is %o', error);
        return new Promise((resolve) => {
          setTimeout(() => {
            this._initDiscovery().then(resolve, resolve);
          }, 1000);
        });
      });
  }

  /**
   * Change the currently selected box.
   *
   * @param {number} index The index of the box in the boxes array.
   */
  selectBox(index = 0) {
    if (!this[p.boxes].length) {
      this[p.settings].configured = false;
      console.error('No boxes found. Is this app online? Is the box online?');

      return;
    }

    if (index >= this[p.boxes].length) {
      this[p.settings].configured = false;
      console.error('Index out of range.');

      return;
    }

    const box = this[p.boxes][index];

    this[p.settings].localOrigin = box.local_origin;
    if (box.tunnel_origin) {
      this[p.settings].tunnelOrigin = box.tunnel_origin;
    } else {
      this[p.settings].tunnelOrigin = '';
    }

    this[p.settings].client = box.client;
    this[p.settings].configured = true;
  }

  /**
   * Detect a session token in the URL and process it if present.
   *
   * @return {Promise}
   * @private
   */
  _initUserSession() {
    if (this.isLoggedIn) {
      return Promise.resolve();
    }

    const url = new URL(location.href);
    const searchParams = new URLSearchParams(url.search.substring(1));
    if (!searchParams.has('session_token')) {
      return Promise.resolve();
    }

    // There is a session token in the URL, let's remember it.
    // @todo Find a better way to handle URL escape.
    this[p.settings].session = searchParams.get('session_token')
      .replace(/ /g, '+');

    // Remove the session param from the current location.
    searchParams.delete('session_token');
    url.search = searchParams;
    location.replace(url.href);

    // Returning rejected promise here the promise chain.
    return Promise.reject();
  }

  get isLoggedIn() {
    return !!this[p.settings].session;
  }

  /**
   * Redirect the user to the box to get authenticated if she isn't already.
   */
  login() {
    if (this.isLoggedIn) {
      return;
    }

    const redirectUrl = encodeURIComponent(location);
    location.replace(`${this[p.net].origin}/?redirect_url=${redirectUrl}`);
  }

  /**
   * Log out the user.
   */
  logout() {
    this[p.settings].session = null;
  }

  /**
   * Ask the user for accepting push notifications from the box.
   * This method will be call each time that we log in, but will
   * stop the execution if we already have the push subscription
   * information.
   *
   * @param {boolean} resubscribe Parameter used for testing
   * purposes, and follow the whole subscription process even if
   * we have push subscription information.
   * @return {Promise}
   */
  subscribeToNotifications(resubscribe = false) {
    return this[p.webPush].subscribeToNotifications(resubscribe);
  }
}
