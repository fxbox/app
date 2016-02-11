'use strict';

const DB_DEVICE_STORE = 'device';
const DB_ROOM_STORE = 'room';

export default class Db {
  constructor() {
    /**
     * The name of the db
     */
    this.name = 'fxbox-client';

    /**
     * The version of the indexed database
     */
    this.DB_VERSION = 1;

    /**
     * Our local indexed db where we store our copy of bookmarks
     */
    this.db = null;
  }

  get idbName() {
    return this.name + '_db';
  }

  init() {
    return new Promise((resolve, reject) => {
      let req = window.indexedDB.open(this.idbName, this.DB_VERSION);
      req.onupgradeneeded = this.upgradeSchema;
      req.onsuccess = evt => {
        this.db = evt.target.result;
        return resolve();
      };
      req.onerror = (e) => {
        console.error('Error opening database', e);
        return reject(e);
      };
    });
  }

  upgradeSchema(evt) {
    let db = evt.target.result;
    let fromVersion = evt.oldVersion;
    if (fromVersion < 1) {
      let store = db.createObjectStore(DB_DEVICE_STORE, { keyPath: 'id' });
      store.createIndex('id', 'id', { unique: true });
      store.createIndex('type', 'type', { unique: false });

      store = db.createObjectStore(DB_ROOM_STORE, {
        keyPath: 'id',
        autoIncrement: true
      });
      store.createIndex('name', 'name', { unique: true });
    }
  }

  getDevices() {
    return this.getAll(DB_DEVICE_STORE).call(this);
  }

  getRooms() {
    return getAll(DB_ROOM_STORE).call(this);
  }

  getDevice(id) {
    return getById(DB_DEVICE_STORE).call(this, id);
  }

  getRoom(id) {
    return getById(DB_ROOM_STORE).call(this, id);
  }

  setDevice(data) {
    return set(DB_DEVICE_STORE).call(this, data);
  }

  setRoom(data) {
    return set(DB_ROOM_STORE).call(this, data);
  }

  deleteDevice(data) {
    // Is useful?!
    return remove(DB_DEVICE_STORE).call(this, data);
  }

  deleteRoom(data) {
    return remove(DB_ROOM_STORE).call(this, data);
  }
}

function getAll(store) {
  return function() {
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
  return function(id) {
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
  return function(data) {
    return new Promise((resolve, reject) => {
      let txn = this.db.transaction([store], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      try {
        txn.objectStore(store).put({ id: data.id, data: data });
      } catch (e) {
        console.error(`Error putting data in ${this.idbName}:`, e);
        resolve();
      }
    });
  };
}

function remove(store) {
  return function(id) {
    return new Promise((resolve, reject) => {
      let txn = this.db.transaction([store], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      try {
        txn.objectStore(store).delete(id);
      } catch (e) {
        console.error(`Error deleting data from ${this.idbName}:`, e);
        resolve();
      }
    });
  };
}
