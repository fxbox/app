'use strict';

import EventDispatcher from './common/event-dispatcher';
import SequentialTimer from './common/sequential-timer';
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
  pollingTimer: Symbol('pollingTimer'),

  // Private methods.
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
    this[p.pollingTimer] = new SequentialTimer(
      this[p.settings].pollingInterval
    );

    this[p.updateServiceList] = this[p.updateServiceList].bind(this);

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
    if (pollingEnabled === this[p.pollingTimer].started) {
      return;
    }

    if (pollingEnabled) {
      this[p.pollingTimer].start(this[p.updateServiceList]);
    } else {
      this[p.pollingTimer].stop();
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
   * Tries to update service list and emits appropriate events.
   *
   * @return {Promise}
   * @private
   */
  [p.updateServiceList]() {
    return Promise.all([
      this[p.api].get('services'),
      this[p.db].getServices(),
      this[p.getCache](),
    ])
    .then(([fetchedServices, storedServices, cache]) => {
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

            // We should teardown service instance and remove it from the cache.
            const cachedService = cache.get(storedService.id);
            cachedService.teardown();
            cache.delete(cachedService.id);
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
