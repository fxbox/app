/* global URLSearchParams */

'use strict';

import { Service } from 'components/fxos-mvc/dist/mvc';

import FoxboxSettings from './foxbox-settings';
import FoxboxDb from './foxbox-db';

const settings = new FoxboxSettings();
const db = new FoxboxDb();

// Whether or not the SSL tunneling can be used.
let _tunnelConfigured = false;
// Whether we can connect to the box via a local connection.
let _local = false;
// Whether we can connect to the box via a remote connection.
let _remote = false;
// A reference to the interval to get the online status.
let _onlineInterval = null;
// Fixtures for some rules.
let themes = [
  {
    name: 'When front door opens, front door camera sends me a picture.',
    conditionServiceId: 123,
    conditionProp: true,
    actionServiceId: 456,
    actionProp: true,
    enabled: true
  },
  {
    name: 'When a motion sensor detects presence, living room light turns on.',
    conditionServiceId: 123,
    conditionProp: true,
    actionServiceId: 456,
    actionProp: true,
    enabled: false
  }
];

const _private = {
  isPollingEnabled: Symbol('isPollingEnabled'),
  nextPollTimeout: Symbol('nextPollTimeout'),

  fetchServices: Symbol('fetchServices')
};

/**
 * Request a content of the specified type from a specified URL.
 *
 * @param {string} url The URL to send the request to.
 * @param {string} contentType The content mime type (eg. image/jpeg).
 * @param {string} [method=GET] The HTTP method (defaults to "GET").
 * @param {Object} [body] An object of key/value.
 * @return {Promise}
 */
const fetchContent = function(
  url, contentType, method = 'GET', body = undefined
) {
  method = method.toUpperCase();

  const req = {
    method,
    headers: { Accept: contentType },
    cache: 'no-store'
  };

  if (method === 'POST' || method === 'PUT') {
    req.headers['Content-Type'] = 'application/json;charset=UTF-8';
  }

  if (settings.session) {
    // The user is logged in, we authenticate the request.
    req.headers.Authorization = `Bearer ${settings.session}`;
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
    .catch((e) => {
      console.error('Error occurred while fetching content: ', e);
      throw e;
    });
};

/**
 * Request a Blob from a specified URL.
 *
 * @param {string} url The URL to send the request to.
 * @param {string} blobType The Blob mime type (eg. image/jpeg).
 * @param {string} [method=GET] The HTTP method (defaults to "GET").
 * @param {Object} [body] An object of key/value.
 * @return {Promise<Blob>}
 */
const fetchBlob = function(url, blobType, method, body) {
  return fetchContent(url, blobType, method, body)
    .then((response) => response.blob());
};

/**
 * Request a JSON from a specified URL.
 *
 * @param {string} url The URL to send the request to.
 * @param {string} [method=GET] The HTTP method (defaults to "GET").
 * @param {Object} [body] An object of key/value.
 * @return {Promise}
 */
const fetchJSON = function(url, method, body) {
  return fetchContent(url, 'application/json', method, body)
    .then((response) => response.json());
};

/**
 * Get a URL but don't process the response.
 *
 * @param {string} url The URL to send the request to.
 * @return {Promise}
 */
const ping = function(url) {
  return fetch(url, { cache: 'no-store' })
    .then(res => {
      return res.ok;
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

    return this._initUserSession()
      .then(() => {
        return this._initDiscovery();
      })
      .then(() => {
        return this._initNetwork();
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
    if (_local) {
      return this.localOrigin;
    } else if (_remote) {
      return this.tunnelOrigin;
    }

    console.error('The box is out of reach.');
    return this.localOrigin;
  }

  get localOrigin() {
    return `${settings.localScheme}://${settings.localHostname}:${settings.localPort}`;
  }

  get tunnelOrigin() {
    return `${settings.tunnelScheme}://${settings.tunnelHostname}:${settings.tunnelPort}`;
  }

  get localHostname() {
    return settings.localHostname;
  }

  get connected() {
    return _local || _remote;
  }

  get connection() {
    if (_local) {
      return 'local';
    } else if (_remote) {
      return 'remote';
    }
    return 'unknown';
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
  _initDiscovery() {
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

          // We filter out boxes registered more than 5 minutes ago.
          const now = Math.floor(Date.now() / 1000);
          this.boxes = boxes.filter(box => now - box.timestamp < 60 * 5);

          if (!settings.configured) {
            this.selectBox();
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
   * Change the currently selected box.
   *
   * @param {number} index The index of the box in the boxes array.
   */
  selectBox(index = 0) {
    if (index >= this.boxes.length) {
      settings.configured = false;
      console.error('Index out of range.');

      return;
    }

    const box = this.boxes[index];

    settings.localHostname = box.local_ip;
    if (box.tunnel_url) {
      settings.tunnelHostname = box.tunnel_url;
      _tunnelConfigured = true;
    } else {
      settings.tunnelHostname = '';
      _tunnelConfigured = false;
    }

    settings.configured = true;
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
      settings.session = searchParams.get('session_token').replace(/ /g, '+');

      // Remove the session param from the current location.
      searchParams.delete('session_token');
      location.search = searchParams.toString();

      // Throwing here to abort the promise chain.
      throw(new Error('Redirecting to a URL without session'));
    }

    return Promise.resolve();
  }

  /**
   * Attach event listeners related to the connection status.
   *
   * @return {Promise}
   * @private
   */
  _initNetwork() {
    window.addEventListener('online', this.pingBox.bind(this));
    window.addEventListener('offline', this.pingBox.bind(this));

    if ('connection' in navigator && 'onchange' in navigator.connection) {
      navigator.connection.addEventListener('change', this.pingBox.bind(this));

      // We also ping the box every few minutes to make sure it's still there.
      _onlineInterval = setInterval(this.pingBox.bind(this),
        settings.onlineCheckingLongInterval);
    } else {
      // If the Network Information API is not implemented, fallback to polling.
      _onlineInterval = setInterval(this.pingBox.bind(this),
        settings.onlineCheckingInterval);
    }

    this.pingBox();

    return Promise.resolve();
  }

  /**
   * Ping the box to detect whether we connect locally or remotely.
   */
  pingBox() {
    ping(`${this.localOrigin}/ping`)
      .then(() => {
        _local = true;
      })
      .catch(() => {
        _local = false;
      });

    if (_tunnelConfigured) {
      ping(`${this.tunnelOrigin}/ping`)
        .then(() => {
          _remote = true;
        })
        .catch(() => {
          _remote = false;
        });
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
   * @param {boolean} pollingEnabled Flag that indicates whether polling should
   * be started or stopped.
   */
  togglePolling(pollingEnabled) {
    this[_private.isPollingEnabled] = pollingEnabled;

    if (pollingEnabled) {
      this.schedulePoll();
    } else {
      // Cancel next poll attempt if it has been scheduled.
      clearTimeout(this[_private.nextPollTimeout]);
      this[_private.nextPollTimeout] = null;
    }
  }

  /**
   * Schedules an attempt to poll the server, does nothing if polling is not
   * enabled or it has already been scheduled. New poll is scheduled only once
   * previous one is completed or failed.
   */
  schedulePoll() {
    // Return early if polling is not enabled or it has already been scheduled.
    if (!this[_private.isPollingEnabled] ||
      this[_private.nextPollTimeout]) {
      return;
    }

    this[_private.nextPollTimeout] = setTimeout(() => {
      this.refreshServicesByPolling()
        .catch((e) => {
          console.error('Polling has failed, scheduling one more attempt: ', e);
        })
        .then(() => {
          this[_private.nextPollTimeout] = null;

          this.schedulePoll();
        });
    }, settings.pollingInterval);
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

    /*const fetchedServicesPromise = fetchJSON(`${this.origin}/services/list`)
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

    return Promise.all([this.getServices(), this[_private.fetchServices]()])
      .then(([storedServices, fetchedServices]) => {
        let hasNewServices = fetchedServices.reduce(
          (hasNewServices, fetchedService) => {
            const storedService = storedServices.find(
              s => s.id === fetchedService.id
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
            db.setService(fetchedService);

            return hasNewServices || !isExistingService;
          },
          false /* hasNewServices */
        );

        if (hasNewServices ||
          fetchedServices.length !== storedServices.length) {
          // The state of the services changes.
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
    return fetchJSON(`${this.origin}/services/${id}/state`).then(res => {
      if (!res) {
        throw new Error(`The action couldn't be performed.`);
      }

      return res;
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

  getRecipes() {
    return Promise.resolve(themes);
  }

  addRecipe(recipe) {
    themes.push(recipe);
    return Promise.resolve(themes);
  }

  removeRecipe(id) {
    themes.splice(id, 1);
    return Promise.resolve(themes);
  }

  toggleRecipe(id, value = true) {
    themes[id].enabled = value;
    return Promise.resolve(themes);
  }

  performSetOperation(operation, value) {
    return fetchJSON(
      `${this.origin}/api/v${settings.apiVersion}/channels/set`,
      'PUT',
      // Query operation by id.
      [[{ id: operation.id }, { [operation.kind.typ]: value }]]
    );
  }

  performGetOperation(operation) {
    let payload = { id: operation.id };

    if (operation.kind.typ === 'Binary') {
      return fetchBlob(
        `${this.origin}/api/v${settings.apiVersion}/channels/get`,
        // For now we only support JPEG blobs.
        'image/jpeg',
        'PUT',
        payload
      );
    }

    return fetchJSON(
      `${this.origin}/api/v${settings.apiVersion}/channels/get`, 'PUT', payload
    );
  }

  [_private.fetchServices]() {
    return fetchJSON(`${this.origin}/api/v${settings.apiVersion}/services`)
      .then((services) => {
        return services.map((service) => {
          return {
            id: service.id,
            type: service.adapter,
            getters: service.getters,
            setters: service.setters,
            properties: service.properties
          };
        });
      });
  }
}
