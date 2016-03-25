/* global indexedDB */

'use strict';

// The name of the db.
const DB_NAME = 'foxbox-db';

// The version of the indexed database.
const DB_VERSION = 1;

const DB_SERVICE_STORE = 'services';
const DB_TAG_STORE = 'tags';

export default class Db {
  constructor() {
    this.db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      let req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = this.upgradeSchema;
      req.onsuccess = evt => {
        this.db = evt.target.result;

        // Prepopulate the tags with common values.
        this.getTags()
          .then(tags => {
            if (!tags || !tags.length) {
              this.setTag({ name: 'Kitchen' });
              this.setTag({ name: 'Bedroom' });
              this.setTag({ name: 'Living room' });
            }

            return resolve();
          });
      };
      req.onerror = (e) => {
        console.error('Error opening database:', e);
        return reject(e);
      };
    });
  }

  upgradeSchema(evt) {
    let db = evt.target.result;
    let fromVersion = evt.oldVersion;
    if (fromVersion < 1) {
      let store = db.createObjectStore(DB_SERVICE_STORE, { keyPath: 'id' });
      store.createIndex('id', 'id', { unique: true });
      store.createIndex('type', 'type', { unique: false });

      store = db.createObjectStore(DB_TAG_STORE, {
        keyPath: 'id',
        autoIncrement: true
      });
      store.createIndex('name', 'name', { unique: true });
    }
  }

  clear() {
    return new Promise((resolve, reject) => {
      this.db.close();

      var req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = resolve;
      req.onerror = reject;
      req.onblocked = reject;
    });
  }

  getServices() {
    return getAll(DB_SERVICE_STORE).call(this);
  }

  getTags() {
    return getAll(DB_TAG_STORE).call(this);
  }

  getService(id) {
    return getById(DB_SERVICE_STORE).call(this, id);
  }

  getTag(id) {
    return getById(DB_TAG_STORE).call(this, id);
  }

  setService(data) {
    return set(DB_SERVICE_STORE).call(this, data);
  }

  setTag(data) {
    return set(DB_TAG_STORE).call(this, data);
  }

  deleteService(data) {
    // Is useful?!
    return remove(DB_SERVICE_STORE).call(this, data);
  }

  deleteTag(data) {
    return remove(DB_TAG_STORE).call(this, data);
  }

  clearServices() {
    return clear(DB_SERVICE_STORE).call(this);
  }

  clearTags() {
    return clear(DB_TAG_STORE).call(this);
  }
}

function getAll(store) {
  return function getAll() {
    return new Promise((resolve, reject) => {
      let txn = this.db.transaction([store], 'readonly');
      let results = [];
      txn.onerror = reject;
      txn.oncomplete = () => {
        resolve(results);
      };
      txn.objectStore(store).openCursor().onsuccess = evt => {
        let cursor = evt.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        }
      };
    });
  };
}

function getById(store) {
  return function getById(id) {
    return new Promise((resolve, reject) => {
      let txn = this.db.transaction([store], 'readonly');
      txn.onerror = reject;
      txn.objectStore(store).get(id).onsuccess = evt => {
        resolve(evt.target.result);
      };
    });
  };
}

function set(store) {
  return function set(data) {
    return new Promise((resolve, reject) => {
      const id = data.id;
      let txn = this.db.transaction([store], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      try {
        if (id) {
          txn.objectStore(store).put({ id, data });
        } else {
          txn.objectStore(store).put({ data });
        }
      } catch (e) {
        console.error(`Error putting data in ${DB_NAME}:`, e);
        resolve();
      }
    });
  };
}

function remove(store) {
  return function remove(id) {
    return new Promise((resolve, reject) => {
      let txn = this.db.transaction([store], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      try {
        txn.objectStore(store).delete(id);
      } catch (e) {
        console.error(`Error deleting data from ${DB_NAME}:`, e);
        resolve();
      }
    });
  };
}

function clear(store) {
  return function clear() {
    return new Promise((resolve, reject) => {
      var txn = this.db.transaction([store], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      txn.objectStore(store).clear();
    });
  };
}
