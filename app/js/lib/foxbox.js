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

export default class Foxbox extends Service {
  init() {
    return this.discover()
      .then(() => {
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
      })
      .then(() => {
        // The DB is only initialised if there's no redirection to the box.
        return db.init();
      });
  }

  get origin() {
    return `${settings.scheme}://${settings.hostname}:${settings.port}`;
  }

  discover() {
    // For development purposes if you want to skip the
    // discovery phase set the 'foxbox-skipDiscovery' variable to
    // 'true'.
    if (settings.skipDiscovery) {
      return Promise.resolve();
    }

    return fetchJSON(settings.registrationService)
      .then(boxes => {
        if (!Array.isArray(boxes) || boxes.length === 0) {
          return;
        }

        // Multi box setup out of the scope so far.
        const box = boxes[0];

        // Check if we have a recent registry.
        const now = Math.floor(Date.now() / 1000);
        if ((now - box.timestamp) < 60) {
          settings.hostname = box.hostname || box.local_ip;
        }
      });
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
   * Retrieve the list of the services available.
   *
   * @return {Promise} A promise that resolves with an array of objects.
   */
  getServices() {
    return new Promise((resolve, reject) => {
      fetchJSON(`${this.origin}/services/list`)
        .then(services => {
          // Get the state of each service.
          Promise.all(services.map(service => this.getServiceState(service.id)))
            .then(states => {
              services.forEach((service, id) => service.state = states[id]);

              // Get all the services from the db.
              db.getServices()
                .then(storedServices => {
                  services.forEach(service => {
                    // Merge the data from the db with the updated one.
                    const storedService = storedServices.find(s => s.data.id === service.id);
                    if (storedService !== undefined) {
                      service = Object.assign(storedService.data, service);
                    }

                    // Populate the db with the latest service.
                    db.setService(service);
                  });
                });

              return resolve(services);
            });
        });
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
