/* global URLSearchParams */

'use strict';

import { Service } from 'components/mvc';

import Settings from './settings';
import Db from './db';
import Network from './network';
import Recipes from './recipes';
import WebPush from './webpush';

import BaseService from './services/base';
import IpCameraService from './services/ip-camera';
import LightService from './services/light';
import DoorLockService from './services/door-lock';
import MotionSensorService from './services/motion-sensor';

// Private members.
const p = Object.freeze({
  // Private properties.
  settings: Symbol('settings'),
  db: Symbol('db'),
  net: Symbol('net'),
  boxes: Symbol('boxes'),
  isPollingEnabled: Symbol('isPollingEnabled'),
  nextPollTimeout: Symbol('nextPollTimeout'),
  webPush: Symbol('webPush'),

  // Private methods.
  fetchServices: Symbol('fetchServices'),
  getServiceInstance: Symbol('getServiceInstance'),
  hasDoorLockChannel: Symbol('hasDoorLockChannel'),
});

/**
 * Compare 2 objects. Returns true if all properties of object A have the same
 * value in object B. Extraneous properties in object B are ignored.
 * Properties order is not important.
 *
 * @param {Object} objectA
 * @param {Object} objectB
 * @return {boolean}
 */
const isSimilar = (objectA, objectB) => {
  for (let prop in objectA) {
    if (!(prop in objectB) || objectA[prop] !== objectB[prop]) {
      return false;
    }
  }

  return true;
};

export default class Foxbox extends Service {
  constructor() {
    super();

    // Private properties.
    this[p.settings] = new Settings();
    this[p.db] = new Db();
    this[p.net] = new Network(this[p.settings], (foxboxOnline) => {
      this._dispatchEvent('box-online', foxboxOnline);
    });
    this[p.boxes] = Object.freeze([]);
    this[p.isPollingEnabled] = false;
    this[p.nextPollTimeout] = null;
    this[p.webPush] = new WebPush(this[p.net], this[p.settings],
      (msg) => {
        this._dispatchEvent('push-action', msg);
      });

    // Public properties.
    this.recipes = null;

    Object.seal(this);
  }

  init() {
    window.foxbox = this;

    // No need to block the UI on the discovery process.
    // Once we discover a box we can connect to, we will start
    // polling and triggering box-online events with a boolean
    // indicating if we have access to box or not.
    this._initDiscovery()
      .then(() => this[p.net].init())
      .then(() => {
        // Start polling.
        this[p.settings].on('pollingEnabled', () => {
          this.togglePolling(this[p.settings].pollingEnabled);
        });
        this.togglePolling(this[p.settings].pollingEnabled);

        this.recipes = new Recipes({
          settings: this[p.settings],
          net: this[p.net],
        });
      });

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

  get localOrigin() {
    return this[p.settings].localOrigin;
  }

  get clientId() {
    return this[p.settings].clientId;
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
                const { local_origin, tunnel_origin } =
                  JSON.parse(box.message);
                box.local_origin = local_origin;
                box.tunnel_origin = tunnel_origin;
                return Object.freeze(box);
            })
        );

        // If the registration server didn't give us any info and
        // we have no record of previous registrations, we schedule
        // a retry.
        if (!this[p.boxes].length &&
            !this[p.settings]._localOrigin &&
            !this[p.settings]._tunnelOrigin) {
          throw new Error('Registration service did not return any boxes.');
        }

        if (!this[p.settings].configured) {
          this.selectBox();
        }

        this._dispatchEvent('box-online', true);
      })
      .catch((error) => {
        if (this[p.settings]._localOrigin ||
            this[p.settings]._tunnelOrigin) {
          // Default to a previously stored box registration.
          this._dispatchEvent('box-online', true);
        } else {
          // If there's no previously stored box registration, we schedule a
          // retry.
          console.warn('Retrying box discovery... Reason is %o', error);
          return new Promise((resolve) => {
            setTimeout(() => {
              this._initDiscovery().then(resolve, resolve);
            }, 1000);
          });
        }
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

    this[p.settings].clientId = box.client;
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

    const queryString = location.search.substring(1);
    const searchParams = new URLSearchParams(queryString);

    if (searchParams.has('session_token')) {
      // There is a session token in the URL, let's remember it.
      // @todo Find a better way to handle URL escape.
      this[p.settings].session = searchParams.get('session_token')
        .replace(/ /g, '+');

      // Remove the session param from the current location.
      searchParams.delete('session_token');
      location.search = searchParams.toString();

      // Throwing here to abort the promise chain.
      throw(new Error('Redirecting to a URL without session'));
    }

    return Promise.resolve();
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
    this[p.settings].session = undefined;
  }

  /**
   * Start or stop polling.
   *
   * @param {boolean} pollingEnabled Flag that indicates whether polling should
   * be started or stopped.
   */
  togglePolling(pollingEnabled) {
    this[p.isPollingEnabled] = pollingEnabled;

    if (pollingEnabled) {
      this.schedulePoll();
    } else {
      // Cancel next poll attempt if it has been scheduled.
      clearTimeout(this[p.nextPollTimeout]);
      this[p.nextPollTimeout] = null;
    }
  }

  /**
   * Schedules an attempt to poll the server, does nothing if polling is not
   * enabled or it has already been scheduled. New poll is scheduled only once
   * previous one is completed or failed.
   */
  schedulePoll() {
    // Return early if polling is not enabled or it has already been scheduled.
    if (!this[p.isPollingEnabled]
      || this[p.nextPollTimeout]
      || !this.isLoggedIn) {
      return;
    }

    this[p.nextPollTimeout] = setTimeout(() => {
      this.refreshServicesByPolling()
        .catch((error) => {
          console.error('Polling has failed, scheduling one more attempt: ',
            error);
        })
        .then(() => {
          this[p.nextPollTimeout] = null;

          this.schedulePoll();
        });
    }, this[p.settings].pollingInterval);
  }

  /**
   * Detect changes in the services:
   * * Emits a `service-change` event if a service is connected/disconnected.
   * * Emits a `service-state-change` event if the state of a service changes.
   *
   * @return {Promise}
   */
  refreshServicesByPolling() {
    if (!this.isLoggedIn) {
      return Promise.resolve();
    }

    /*const fetchedServicesPromise = this[p.net]
      .fetchJSON(`${this[p.net].origin}/services/list`)
      .then((services) => {
        // @todo We should ask for state only for services that actually support
        // it.
        return Promise.all(
          services.map((service) => {
            // Use empty state if service failed to return actual state.
            return this.getServiceState(service.id)
              .catch(() => ({}))
              .then((state) => service.state = state);
          })
        ).then(() => services);
      });*/

    return Promise.all([this.getServices(), this[p.fetchServices]()])
      .then(([storedServices, fetchedServices]) => {
        const hasNewServices = fetchedServices.reduce(
          (hasNewServices, fetchedService) => {
            const storedService = storedServices.find(
              (service) => service.id === fetchedService.id
            );

            const isExistingService = !!storedService;

            if (isExistingService &&
              isSimilar(fetchedService.state, storedService.state)) {
              return hasNewServices;
            }

            fetchedService = isExistingService ?
              Object.assign(storedService, fetchedService) : fetchedService;

            this._dispatchEvent('service-state-change', fetchedService);

            // Populate the db with the latest service.
            this[p.db].setService(fetchedService);

            return hasNewServices || !isExistingService;
          },
          false /* hasNewServices */
        );

        if (hasNewServices ||
          fetchedServices.length !== storedServices.length) {
          // The services changed.
          fetchedServices = fetchedServices.map(
            this[p.getServiceInstance].bind(this)
          );
          this._dispatchEvent('service-change', fetchedServices);
        }

        return fetchedServices;
      });
  }

  /**
   * Retrieve the list of the services available.
   * Use the database as a source of truth.
   *
   * @return {Promise} A promise that resolves with an array of objects.
   */
  getServices() {
    return this[p.db].getServices()
      .then((services) => services.map(
        (service) => this[p.getServiceInstance](service.data)
      ));
  }

  getTags() {
    return this[p.db].getTags.apply(this[p.db], arguments);
  }

  // @todo If service doesn't exist in the DB, fetch it from the box.
  getService() {
    // Get data from the DB so we get the attributes, the state and the tags.
    return this[p.db].getService.apply(this[p.db], arguments)
      .then((service) => this[p.getServiceInstance](service.data));
  }

  setService() {
    return this[p.db].setService.apply(this[p.db], arguments);
  }

  setTag() {
    return this[p.db].setTag.apply(this[p.db], arguments);
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

  [p.fetchServices]() {
    return this[p.net].fetchJSON(
      `${this[p.net].origin}/api/v${this[p.settings].apiVersion}/services`
    );
  }

  [p.getServiceInstance](data) {
    const config = {
      net: this[p.net],
      settings: this[p.settings],
    };

    switch (data.adapter) {
      case 'ip-camera@link.mozilla.org':
        return new IpCameraService(data, config);

      case 'philips_hue@link.mozilla.org':
        return new LightService(data, config);

      case 'OpenZwave Adapter':
        if (this[p.hasDoorLockChannel](data.getters) ||
            this[p.hasDoorLockChannel](data.setters)) {
          return new DoorLockService(data, config);
        }

        return new MotionSensorService(data, config);

      default:
        return new BaseService(data, config);
    }
  }

  [p.hasDoorLockChannel](channels) {
    return Object.keys(channels).find(
      (key) => channels[key].kind === 'DoorLocked'
    );
  }
}
