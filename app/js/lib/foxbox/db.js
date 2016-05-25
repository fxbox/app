'use strict';

import Defer from './common/defer';

// Private members.
const p = Object.freeze({
  // Private properties.
  db: Symbol('db'),
  initializationStarted: Symbol('initializationStarted'),

  // Private methods.
  upgradeSchema: Symbol('upgradeSchema'),
  getAll: Symbol('getAll'),
  getById: Symbol('getById'),
  set: Symbol('set'),
  remove: Symbol('remove'),
  clearDb: Symbol('clearDb'),
});

// The name of the db.
const DB_NAME = 'foxbox-db';

// The version of the indexed database.
const DB_VERSION = 1;

const DB_SERVICE_STORE = 'services';

export default class Db {
  constructor() {
    this[p.db] = new Defer();
    this[p.initializationStarted] = false;

    Object.seal(this);
  }

  init() {
    // We don't to expose internal DB object outside of DB class.
    const initializationPromise = this[p.db].promise.then(() => {});

    if (this[p.initializationStarted]) {
      return initializationPromise;
    }

    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = this[p.upgradeSchema];
      req.onsuccess = (evt) => this[p.db].resolve(evt.target.result);
      req.onerror = (error) => this[p.db].reject(error);
    } catch(error) {
      this[p.db].reject(error);
    }

    return initializationPromise
      .catch((error) => {
        console.error('Error opening database: %o', error);
        throw error;
      });
  }

  clear() {
    return this[p.db].promise
      .then((db) => {
        db.close();

        return new Promise((resolve, reject) => {
          const req = indexedDB.deleteDatabase(DB_NAME);
          req.onsuccess = resolve;
          req.onerror = reject;
          req.onblocked = reject;
        });
      })
      .then(() => {
        this[p.db] = new Defer();
        this[p.initializationStarted] = false;
      });
  }

  getServices() {
    return this[p.getAll](DB_SERVICE_STORE);
  }

  getService(id) {
    return this[p.getById](DB_SERVICE_STORE, id);
  }

  setService(data) {
    return this[p.set](DB_SERVICE_STORE, data);
  }

  deleteService(data) {
    return this[p.remove](DB_SERVICE_STORE, data.id);
  }

  clearServices() {
    return this[p.clearDb](DB_SERVICE_STORE);
  }

  [p.upgradeSchema](evt) {
    const db = evt.target.result;
    const fromVersion = evt.oldVersion;
    if (fromVersion < 1) {
      const store = db.createObjectStore(DB_SERVICE_STORE, { keyPath: 'id' });
      store.createIndex('id', 'id', { unique: true });
    }
  }

  [p.getAll](store) {
    return this[p.db].promise
      .then((db) => {
        return new Promise((resolve, reject) => {
          const txn = db.transaction([store], 'readonly');
          const results = [];
          txn.onerror = reject;
          txn.oncomplete = () => resolve(results);
          txn.objectStore(store).openCursor().onsuccess = (evt) => {
            const cursor = evt.target.result;
            if (cursor) {
              results.push(cursor.value);
              cursor.continue();
            }
          };
        });
      });
  }

  [p.getById](store, id) {
    return this[p.db].promise
      .then((db) => {
        return new Promise((resolve, reject) => {
          const txn = db.transaction([store], 'readonly');
          txn.onerror = reject;
          txn.objectStore(store).get(id).onsuccess = (evt) => {
            resolve(evt.target.result);
          };
        });
      });
  }

  [p.set](store, data) {
    return this[p.db].promise
      .then((db) => {
        return new Promise((resolve, reject) => {
          const txn = db.transaction([store], 'readwrite');
          txn.oncomplete = resolve;
          txn.onerror = reject;
          try {
            txn.objectStore(store).put(data);
          } catch (error) {
            console.error(`Error putting data in ${DB_NAME}:`, error);
            resolve();
          }
        });
      });
  }

  [p.remove](store, id) {
    return this[p.db].promise
      .then((db) => {
        return new Promise((resolve, reject) => {
          const txn = db.transaction([store], 'readwrite');
          txn.oncomplete = resolve;
          txn.onerror = reject;
          try {
            txn.objectStore(store).delete(id);
          } catch (error) {
            console.error(`Error deleting data from ${DB_NAME}:`, error);
            resolve();
          }
        });
      });
  }

  [p.clearDb](store) {
    return this[p.db].promise
      .then((db) => {
        return new Promise((resolve, reject) => {
          const txn = db.transaction([store], 'readwrite');
          txn.oncomplete = resolve;
          txn.onerror = reject;
          txn.objectStore(store).clear();
        });
      });
  }
}
