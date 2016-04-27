'use strict';

import EventDispatcher from './event-dispatcher';
import BaseService from './services/base';
import IpCameraService from './services/ip-camera';
import LightService from './services/light';
import DoorLockService from './services/door-lock';
import MotionSensorService from './services/motion-sensor';

const p = Object.freeze({
  api: Symbol('api'),
  settings: Symbol('settings'),
  db: Symbol('db'),
  cache: Symbol('services'),
  isPollingEnabled: Symbol('isPollingEnabled'),
  nextPollTimeout: Symbol('nextPollTimeout'),

  // Private methods.
  schedulePoll: Symbol('schedulePoll'),
  getServiceInstance: Symbol('getServiceInstance'),
  hasDoorLockChannel: Symbol('hasDoorLockChannel'),
  updateServiceList: Symbol('updateServiceList'),
  getCache: Symbol('getCache'),
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
  const keysA = Object.keys(objectA);
  const keysB = Object.keys(objectB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  return !keysA.some((keyA) => {
    const valueA = objectA[keyA];
    const valueB = objectB[keyA];

    const typeA = typeof valueA;

    if (typeA !== typeof valueB) {
      return true;
    }

    if (typeA !== 'object' || valueA === null || valueB === null) {
      return valueA !== valueB;
    }

    return !isSimilar(valueA, valueB);
  });
};

export default class Services extends EventDispatcher {
  constructor(db, api, settings) {
    super(['services-changed', 'service-changed']);

    this[p.db] = db;
    this[p.api] = api;
    this[p.settings] = settings;

    this[p.cache] = null;
    this[p.isPollingEnabled] = false;
    this[p.nextPollTimeout] = null;

    Object.seal(this);
  }

  /**
   * Retrieves the list of the services available. Relies on IndexedDB and
   * in-memory cache.
   *
   * @return {Promise<Array<BaseService>>} A promise that resolves with an
   * array of objects.
   */
  getAll() {
    return this[p.getCache]().then((cache) => Array.from(cache.values()));
  }

  /**
   * Gets service by id from in-memory cache.
   * @todo If service doesn't exist in the DB, fetch it from the box.
   *
   * @param {string} id Id of the service we retrieve.
   * @return {Promise<BaseService>}
   */
  get(id) {
    return this[p.getCache]().then((cache) => cache.get(id));
  }

  /**
   * Starts or stops polling.
   *
   * @param {boolean} pollingEnabled Flag that indicates whether polling should
   * be started or stopped.
   */
  togglePolling(pollingEnabled) {
    this[p.isPollingEnabled] = pollingEnabled;

    if (pollingEnabled) {
      this[p.schedulePoll]();
    } else {
      // Cancel next poll attempt if it has been scheduled.
      clearTimeout(this[p.nextPollTimeout]);
      this[p.nextPollTimeout] = null;
    }
  }

  /**
   * Returns in-memory service cache. When cache is not initialized we fill it
   * in with the content of local IndexedDB.
   *
   * @return {Promise<Map<string, BaseService>>}
   * @private
   */
  [p.getCache]() {
    if (this[p.cache]) {
      return Promise.resolve(this[p.cache]);
    }

    const cache = this[p.cache] = new Map();

    return this[p.db].getServices()
      .then((dbServices) => {
        dbServices.forEach((dbService) => {
          cache.set(dbService.id, this[p.getServiceInstance](dbService));
        });

        return cache;
      });
  }

  /**
   * Schedules an attempt to poll the server, does nothing if polling is not
   * enabled or it has already been scheduled. New poll is scheduled only once
   * previous one is completed or failed.
   *
   * @private
   */
  [p.schedulePoll]() {
    // Return early if polling is not enabled or it has already been scheduled.
    if (!this[p.isPollingEnabled] || this[p.nextPollTimeout]) {
      return;
    }

    this[p.nextPollTimeout] = setTimeout(() => {
      Promise.all([this[p.db].getServices(), this[p.api].get('services')])
        .then(([storedServices, fetchedServices]) => {
          return this[p.updateServiceList](storedServices, fetchedServices);
        })
        .catch((error) => {
          console.error(
            'Polling has failed, scheduling one more attempt: ',
            error
          );
        })
        .then(() => {
          this[p.nextPollTimeout] = null;
          this[p.schedulePoll]();
        });
    }, this[p.settings].pollingInterval);
  }

  /**
   * Tries to update service list and emits appropriate events.
   *
   * @param {Array<Object>} storedServices Services currently stored in DB.
   * @param {Array<Object>} fetchedServices Services returned from the server.
   * @return {Promise}
   * @private
   */
  [p.updateServiceList](storedServices, fetchedServices) {
    return this[p.getCache]()
      .then((cache) => {
        let servicesToAddCount = 0;
        fetchedServices.forEach((fetchedService) => {
          const storedService = storedServices.find(
            (storedService) => storedService.id === fetchedService.id
          );

          const isExistingService = !!storedService;

          if (isExistingService && isSimilar(fetchedService, storedService)) {
            return;
          }

          // Populate the db with the latest service.
          this[p.db].setService(fetchedService);

          const service = this[p.getServiceInstance](fetchedService);
          cache.set(service.id, service);

          if (isExistingService) {
            this.emit('service-changed', service);
          } else {
            servicesToAddCount++;
          }
        });

        const servicesToRemoveCount = storedServices.length +
          servicesToAddCount - fetchedServices.length;
        if (servicesToRemoveCount > 0) {
          storedServices.forEach((storedService) => {
            const fetchedService = fetchedServices.find(
              (fetchedService) => fetchedService.id === storedService.id
            );

            if (!fetchedService) {
              this[p.db].deleteService(storedService);
              cache.delete(storedService.id);
            }
          });
        }

        if (servicesToAddCount > 0 || servicesToRemoveCount > 0) {
          this.emit('services-changed');
        }
      });
  }

  /**
   * Creates specific service instance using raw data returned from server. If
   * there is no specific service class provided, BaseService class is used.
   *
   * @param {Object} data Service raw data.
   * @return {Object}
   * @private
   */
  [p.getServiceInstance](data) {
    switch (data.adapter) {
      case 'ip-camera@link.mozilla.org':
        return new IpCameraService(data, this[p.api]);

      case 'philips_hue@link.mozilla.org':
        return new LightService(data, this[p.api]);

      case 'OpenZwave Adapter':
        if (this[p.hasDoorLockChannel](data.getters) ||
          this[p.hasDoorLockChannel](data.setters)) {
          return new DoorLockService(data, this[p.api]);
        }

        if (Object.keys(data.getters).length > 0) {
          return new MotionSensorService(data, this[p.api]);
        }

        return new BaseService(data, this[p.api]);

      default:
        return new BaseService(data, this[p.api]);
    }
  }

  /**
   * Detects if channel list (getters/setters) contains channel with
   * 'DoorLocked' kind.
   *
   * @param {Array<Object>} channels List of the channels to look through.
   * @return {Object}
   * @private
   */
  [p.hasDoorLockChannel](channels) {
    return Object.keys(channels).find(
      (key) => channels[key].kind === 'DoorLocked'
    );
  }
}
