/* global URLSearchParams */

'use strict';

import { Service } from 'components/fxos-mvc/dist/mvc';

import FoxboxSettings from './foxbox-settings';
import FoxboxDb from './foxbox-db';

const settings = new FoxboxSettings();
const db = new FoxboxDb();

/**
 * Request a JSON from a specified URL.
 *
 * @param {string} url The URL to send the request to.
 * @param {string} method The HTTP method (defaults to "GET").
 * @param {!Object} body An object of key/value.
 * @return {Promise}
 */
const fetchJSON = function(url, method = 'GET', body = undefined) {
  method = method.toUpperCase();

  const req = {
    method,
    headers: {
      'Accept': 'application/json'
    },
    cache: 'no-store'
  };

  if (method === 'POST' || method === 'PUT') {
    req.headers['Content-Type'] = 'application/json;charset=UTF-8';
  }
  if (settings.session) {
    // The user is logged in, we authenticate the request.
    req.headers.Authorization = `Bearer ${settings.session}`;
  }

  if (method === 'GET' || method === 'HEAD') {
    body = undefined;
  }
  if (body !== undefined) {
    req.body = JSON.stringify(body);
  }

  return fetch(url, req)
    .then(res => {
      if (res.ok) {
        return res.json();
      }

      throw new TypeError(`The response returned a ${res.status} HTTP status code.`);
    });
};

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
  init() {
    window.foxbox = this;
    return this._discover()
      .then(() => {
        return this._processUserSession();
      })
      .then(() => {
        // The DB is only initialised if there's no redirection to the box.
        return db.init();
      })
      .then(() => {
        // Start polling.
        settings.on('pollingEnabled', () => {
          this.togglePolling(settings.pollingEnabled);
        });
        this.togglePolling(settings.pollingEnabled);
      });
  }

  /**
   * Clear all data/settings stored on the browser. Use with caution.
   */
  clear() {
    const promises = [settings.clear(), db.clear()];
    return Promise.all(promises);
  }

  get origin() {
    return `${settings.scheme}://${settings.hostname}:${settings.port}`;
  }

  /**
   * Get the IP address of the box on the local network using the registration
   * server.
   * If it fails, we fallback to the previously set hostname.
   * It there isn't, it falls back to localhost.
   *
   * @returns {Promise}
   * @private
   */
  _discover() {
    // For development purposes if you want to skip the
    // discovery phase set the 'foxbox-skipDiscovery' variable to
    // 'true'.
    if (settings.skipDiscovery) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      fetchJSON(settings.registrationService)
        .then(boxes => {
          if (!Array.isArray(boxes) || boxes.length === 0) {
            return resolve();
          }

          // Multi box setup out of the scope so far.
          const box = boxes[0];

          // Check if we have a recent registry.
          const now = Math.floor(Date.now() / 1000);
          if ((now - box.timestamp) < 60) {
            settings.hostname = box.hostname || box.local_ip;
          }

          resolve();
        })
        .catch(() => {
          // When something goes wrong, we still want to resolve the promise so
          // that a hostname set previously is reused.
          resolve();
        });
    });
  }

  /**
   * Detect a session token in the URL and process it if present.
   *
   * @private
   */
  _processUserSession() {
    if (this.isLoggedIn) {
      return;
    }

    const queryString = location.search.substring(1);
    const searchParams = new URLSearchParams(queryString);

    if (searchParams.has('session_token')) {
      // There is a session token in the URL, let's remember it.
      // @todo Find a better way to handle URL escape.
      settings.session = searchParams.get('session_token').replace(/ /g, '+');

      // Remove the session param from the current location.
      searchParams.delete('session_token');
      location.search = searchParams.toString();

      // Throwing here to abort the promise chain.
      throw(new Error('Redirecting to a URL without session'));
    }
  }

  get isLoggedIn() {
    return !!settings.session;
  }

  /**
   * Redirect the user to the box to get authenticated if she isn't already.
   */
  login() {
    if (this.isLoggedIn) {
      return;
    }

    const redirectUrl = encodeURIComponent(location);
    location.replace(`${this.origin}/?redirect_url=${redirectUrl}`);
  }

  /**
   * Log out the user.
   */
  logout() {
    settings.session = undefined;
  }

  /**
   * Start or stop polling.
   *
   * @param {boolean} pollingEnabled
   */
  togglePolling(pollingEnabled = settings.pollingEnabled) {
    if (pollingEnabled) {
      this.pollingInterval = setInterval(this.refreshServicesByPolling.bind(this),
        settings.pollingInterval);

      // We immediately sync the data with the box.
      this.refreshServicesByPolling();
    } else {
      clearInterval(this.pollingInterval);
    }
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

    return new Promise((resolve, reject) => {
      let hasChanged = false;

      Promise.all([
          this.getServices(),
          fetchJSON(`${this.origin}/services/list`)
        ])
        .then(res => {
          // Detect newly connected/disconnected services.
          const storedServices = res[0];
          const fetchedServices = res[1];

          // Any newly connected devices?
          fetchedServices.some(serviceA => {
            const service = storedServices.find(serviceB => serviceA.id === serviceB.id);
            if (!service) {
              hasChanged = true;
              return true;
            }
          });

          // Any newly disconnected devices?
          storedServices.some(serviceA => {
            const service = fetchedServices.find(serviceB => serviceA.id === serviceB.id);
            if (!service) {
              hasChanged = true;
              return true;
            }
          });

          return [storedServices, fetchedServices];
        })
        .then(res => {
          // Detect change in service states.
          const storedServices = res[0];
          const fetchedServices = res[1];

          Promise.all(fetchedServices.map(service => this.getServiceState(service.id)))
            .then(states => {
              fetchedServices.forEach((fetchedService, id) => {
                // Populate the service objects with states.
                fetchedService.state = states[id];

                const storedService = storedServices.find(s => s.id === fetchedService.id);

                if (!storedService) {
                  this._dispatchEvent('service-state-change', fetchedService);

                  // Populate the db with the latest service.
                  db.setService(fetchedService);

                  return;
                }

                if (!isSimilar(fetchedService.state, storedService.state)) {
                  fetchedService = Object.assign(storedService, fetchedService);

                  this._dispatchEvent('service-state-change', fetchedService);

                  // Populate the db with the latest service.
                  db.setService(fetchedService);
                }
              });

              if (hasChanged) {
                // The state of the services changes.
                this._dispatchEvent('service-change', fetchedServices);
              }

              return resolve(fetchedServices);
            });
        });
    });
  }

  /**
   * Retrieve the list of the services available.
   * Use the database as a source of truth.
   *
   * @return {Promise} A promise that resolves with an array of objects.
   */
  getServices() {
    return db.getServices()
      .then(services => {
        return services.map(service => service.data);
      });
  }

  /**
   * Fetch the state of a service from the box.
   *
   * @param {string} id The ID of the service.
   * @return {Promise}
   */
  getServiceState(id) {
    return new Promise((resolve, reject) => {
      fetchJSON(`${this.origin}/services/${id}/state`)
        .then(res => {
          if (!res) {
            return reject(new Error(`The action couldn't be performed.`));
          }

          return resolve(res);
        });
    });
  }

  /**
   * Change the state of a service.
   *
   * @param {string} id The ID of the service.
   * @param {Object} state An object containing pairs of key/value.
   * @return {Promise}
   */
  setServiceState(id, state) {
    return new Promise((resolve, reject) => {
      fetchJSON(`${this.origin}/services/${id}/state`, 'PUT', state)
        .then(res => {
          if (!res || !res.result || res.result !== 'success') {
            return reject(new Error(`The action couldn't be performed.`));
          }

          return resolve();
        });
    });
  }

  getTags() {
    return db.getTags.apply(db, arguments);
  }

  getService() {
    // Get data from the DB so we get the attributes, the state and the tags.
    return db.getService.apply(db, arguments);
  }

  setService() {
    return db.setService.apply(db, arguments);
  }

  setTag() {
    return db.setTag.apply(db, arguments);
  }
}
