/* global indexedDB */

'use strict';

// Private members.
const p = Object.freeze({
  // Private properties.
  db: Symbol('db'),

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
const DB_TAG_STORE = 'tags';

export default class Db {
  constructor() {
    // Private properties.
    this[p.db] = null;

    Object.seal(this);
  }

  init() {
    return new Promise((resolve, reject) => {
      let req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = this[p.upgradeSchema];
      req.onsuccess = (evt) => {
        this[p.db] = evt.target.result;

        // Prepopulate the tags with common values.
        this.getTags()
          .then((tags) => {
            if (!tags || !tags.length) {
              this.setTag({ name: 'Kitchen' });
              this.setTag({ name: 'Bedroom' });
              this.setTag({ name: 'Living room' });
            }

            return resolve();
          });
      };
      req.onerror = (error) => {
        console.error('Error opening database:', error);
        return reject(error);
      };
    });
  }

  [p.upgradeSchema](evt) {
    let db = evt.target.result;
    let fromVersion = evt.oldVersion;
    if (fromVersion < 1) {
      let store = db.createObjectStore(DB_SERVICE_STORE, { keyPath: 'id' });
      store.createIndex('id', 'id', { unique: true });
      store.createIndex('type', 'type', { unique: false });

      store = db.createObjectStore(DB_TAG_STORE, {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('name', 'name', { unique: true });
    }
  }

  clear() {
    return new Promise((resolve, reject) => {
      this[p.db].close();

      let req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = resolve;
      req.onerror = reject;
      req.onblocked = reject;
    });
  }

  getServices() {
    return this[p.getAll](DB_SERVICE_STORE);
  }

  getTags() {
    return this[p.getAll](DB_TAG_STORE);
  }

  getService(id) {
    return this[p.getById](DB_SERVICE_STORE, id);
  }

  getTag(id) {
    return this[p.getById](DB_TAG_STORE, id);
  }

  setService(data) {
    return this[p.set](DB_SERVICE_STORE, data);
  }

  setTag(data) {
    return this[p.set](DB_TAG_STORE, data);
  }

  deleteService(data) {
    // Is useful?!
    return this[p.remove](DB_SERVICE_STORE, data);
  }

  deleteTag(data) {
    return this[p.remove](DB_TAG_STORE, data);
  }

  clearServices() {
    return this[p.clearDb](DB_SERVICE_STORE);
  }

  clearTags() {
    return this[p.clearDb](DB_TAG_STORE);
  }

  [p.getAll](store) {
    return new Promise((resolve, reject) => {
      let txn = this[p.db].transaction([store], 'readonly');
      let results = [];
      txn.onerror = reject;
      txn.oncomplete = () => {
        resolve(results);
      };
      txn.objectStore(store).openCursor().onsuccess = (evt) => {
        let cursor = evt.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        }
      };
    });
  }

  [p.getById](store, id) {
    return new Promise((resolve, reject) => {
      let txn = this[p.db].transaction([store], 'readonly');
      txn.onerror = reject;
      txn.objectStore(store).get(id).onsuccess = (evt) => {
        resolve(evt.target.result);
      };
    });
  }

  [p.set](store, data) {
    return new Promise((resolve, reject) => {
      const id = data.id;
      let txn = this[p.db].transaction([store], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      try {
        if (id) {
          txn.objectStore(store).put({ id, data });
        } else {
          txn.objectStore(store).put({ data });
        }
      } catch (error) {
        console.error(`Error putting data in ${DB_NAME}:`, error);
        resolve();
      }
    });
  }

  [p.remove](store, id) {
    return new Promise((resolve, reject) => {
      let txn = this[p.db].transaction([store], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      try {
        txn.objectStore(store).delete(id);
      } catch (error) {
        console.error(`Error deleting data from ${DB_NAME}:`, error);
        resolve();
      }
    });
  }

  [p.clearDb](store) {
    return new Promise((resolve, reject) => {
      let txn = this[p.db].transaction([store], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      txn.objectStore(store).clear();
    });
  }
}
