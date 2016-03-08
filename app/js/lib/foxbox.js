/* global Headers */

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
 * @param {!Object} extraHeaders Any additional headers to include in the request.
 * @return {Promise}
 */
const fetchJSON = function(url, method = 'GET', body = undefined, extraHeaders = {}) {
  method = method.toUpperCase();

  const req = {
    method,
    headers: new Headers({
      'Accept': 'application/json'
    }),
    cache: 'no-store'
  };

  if (method === 'POST' || method === 'PUT') {
    req.headers.append('Content-Type', 'application/json;charset=UTF-8');
  }
  for (let header in extraHeaders) {
    req.headers.append(header, extraHeaders[header]);
  }
  if (!extraHeaders.Authorization && !!settings.session) {
    // The user is logged in, we authenticate the request.
    req.headers.append('Authorization', `Bearer ${settings.session}`);
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
    this.discover();
    return db.init();
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

    return fetchJSON(settings.registrationService).then(boxes => {
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
   * Log in a user given her credentials.
   *
   * @param {string} username
   * @param {string} password
   * @return {Promise}
   */
  login(username, password) {
    if (!username) {
      return Promise.reject(new Error('Specify a user name.'));
    }
    if (!password) {
      return Promise.reject(new Error('Specify a password.'));
    }

    const header = {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`
    };
    return fetchJSON(`${this.origin}/users/login`, 'POST', undefined, header)
      .then(res => {
        if (!res.session_token) {
          throw(new Error('Token is missing.'));
        }

        settings.session = res.session_token;
      });
  }

  /**
   * Log out the user.
   *
   * @return {Promise} A promise that resolves once the user is logged out.
   */
  logout() {
    settings.session = undefined;
    return Promise.resolve();
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
          const promises =
            services.map(service => fetchJSON(`http://localhost:3000/services/${service.id}/state`));
          Promise.all(promises)
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
   * Change the state of a service.
   *
   * @param {string} id The ID of the service.
   * @param {Object} state An object containing pairs of key/value.
   * @return {Promise}
   */
  changeServiceState(id, state) {
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
