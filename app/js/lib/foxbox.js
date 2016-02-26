import { Service } from 'components/fxos-mvc/dist/mvc';

import FoxboxSettings from './foxbox-settings';

// The delay after which a request is considered failed.
const REQUEST_TIMEOUT = 5000;

/**
 * Request a JSON from a specified URL.
 *
 * @param {string} url The URL to send the request to.
 * @param {string} method The HTTP method (defaults to "GET").
 * @param {Object} body An object of key/value.
 * @return {Promise}
 */
const loadJSON = function(url, method = 'GET', body = undefined) {
  method = method.toUpperCase();

  let req = {
    method,
    headers: {
      'Accept': 'application/json'
    },
    cache: 'no-store'
  };

  if (body !== undefined) {
    req.body = JSON.stringify(body);
  }
  if (method === 'GET' || method === 'HEAD') {
    delete req.body;
  }

  // Workaround to catch network failures.
  return new Promise((resolve, reject) => {
    let hasTimedOut = false;
    const timeout = setTimeout(() => {
      hasTimedOut = true;
      reject(new Error('Request timed out'));
    }, REQUEST_TIMEOUT);

    fetch(url, req)
      .then(response => {
        if (hasTimedOut) {
          return;
        }

        clearTimeout(timeout);
        return resolve(response.json());
      });
  });
};

export default class Foxbox extends Service {
  constructor() {
    super();
    this.settings = new FoxboxSettings();
  }

  get origin() {
    return `${this.settings.scheme}://${this.settings.hostname}:${this.settings.port}`;
  }

  /**
   * Retrieve the list of the services available.
   *
   * @return {Promise} A promise that resolves with an array of objects.
   */
  getServices() {
    return new Promise((resolve, reject) => {
      loadJSON(`${this.origin}/services/list.json`)
        .then(services => {
          // Let's remove the dummy services here.
          services = services.filter(service => service.name !== 'dummy service');

          const promises =
            services.map(service => loadJSON(`http://localhost:3000/services/${service.id}/state`, 'GET'));
          Promise.all(promises)
            .then(states => {
              services.forEach((service, id) => service.state = states[id]);

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
      loadJSON(`${this.origin}/services/${id}/state`, 'PUT', state)
        .then(response => {
          if (!response || !response.result || response.result !== 'success') {
            return reject(new Error(`The action couldn't be performed.`));
          }

          return resolve();
        });
    });
  }
}
