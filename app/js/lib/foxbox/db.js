'use strict';

import Defer from './common/defer';
import IndexedDbStorage from './common/indexed-db-storage';
import InMemoryStorage from './common/in-memory-storage';

// Private members.
const p = Object.freeze({
  storage: Symbol('storage'),
  initializationStarted: Symbol('initializationStarted'),
});

// The name of the db.
const DB_NAME = 'foxbox-db';

// The version of the indexed database.
const DB_VERSION = 1;

const DB_SERVICE_STORE = 'services';

class FoxboxIndexedDbStorage extends IndexedDbStorage {
  onUpgradeNeeded(evt) {
    const db = evt.target.result;
    const fromVersion = evt.oldVersion;
    if (fromVersion < 1) {
      const store = db.createObjectStore(DB_SERVICE_STORE);
      store.createIndex('id', 'id', { unique: true });
    }
  }
}

export default class Db {
  constructor() {
    this[p.storage] = new Defer();
    this[p.initializationStarted] = false;

    Object.seal(this);
  }

  init() {
    // We don't to expose internal storage object outside of DB class.
    const initializationPromise = this[p.storage].promise.then(() => {});
    if (this[p.initializationStarted]) {
      return initializationPromise;
    }

    this[p.initializationStarted] = true;

    const indexedDbStorage = new FoxboxIndexedDbStorage(DB_NAME, DB_VERSION);
    indexedDbStorage.open()
      .then(() => this[p.storage].resolve(indexedDbStorage))
      .catch((error) => {
        console.error(
          'Could not open IndexedDB. Falling back to in-memory storage', error
        );

        this[p.storage].resolve(new InMemoryStorage());
      });

    return initializationPromise
      .catch((error) => {
        console.error('Error opening database: %o', error);
        throw error;
      });
  }

  clear() {
    return this[p.storage].promise
      .then((storage) => storage.clearAll())
      .then(() => {
        this[p.storage] = new Defer();
        this[p.initializationStarted] = false;
      });
  }

  getServices() {
    return this[p.storage].promise
      .then((storage) => storage.getAll(DB_SERVICE_STORE));
  }

  getService(id) {
    return this[p.storage].promise
      .then((storage) => storage.getByKey(DB_SERVICE_STORE, id));
  }

  setService(data) {
    return this[p.storage].promise
      .then((storage) => storage.set(DB_SERVICE_STORE, data.id, data));
  }

  deleteService(data) {
    return this[p.storage].promise
      .then((storage) => storage.remove(DB_SERVICE_STORE, data.id));
  }
}
