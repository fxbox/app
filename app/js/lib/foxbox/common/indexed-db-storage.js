'use strict';

const p = Object.freeze({
  db: Symbol('db'),
  dbName: Symbol('dbName'),
  dbVersion: Symbol('dbVersion'),
});

export default class IndexedDbStorage {
  /**
   * Creates IndexDb storage wrapper.
   *
   * @param {string} dbName Name of the IndexedDB to use.
   * @param {number} dbVersion Version of the IndexedDB to use.
   * @constructor
   */
  constructor(dbName, dbVersion) {
    if (!dbName || typeof dbName !== 'string') {
      throw new Error('Database name should be a valid non-empty string!');
    }

    if (dbVersion < 0 || !Number.isInteger(dbVersion)) {
      throw new Error('Database version should be a positive integer number!');
    }

    this[p.dbName] = dbName;
    this[p.dbVersion] = dbVersion;
  }

  /**
   * Tries to open IndexedDB, returns rejected promise if operation failed.
   *
   * @returns {Promise}
   */
  open() {
    return new Promise((resolve, reject) => {
      const dbOpenRequest = indexedDB.open(this[p.dbName], this[p.dbVersion]);

      dbOpenRequest.onsuccess = (evt) => {
        this[p.db] = evt.target.result;
        resolve();
      };

      dbOpenRequest.onupgradeneeded = this.onUpgradeNeeded.bind(this);
      dbOpenRequest.onerror = reject;
    });
  }

  /**
   * Gets all items from the specified store.
   *
   * @param {string} storeKey Key of the store to retrieve all items from.
   * @return {Promise.<Array>}
   */
  getAll(storeKey) {
    return new Promise((resolve, reject) => {
      const txn = this[p.db].transaction([storeKey], 'readonly');
      const results = [];
      txn.onerror = reject;
      txn.oncomplete = () => resolve(results);
      txn.objectStore(storeKey).openCursor().onsuccess = (evt) => {
        const cursor = evt.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        }
      };
    });
  }

  /**
   * Returns single item from the specified store by item's key.
   *
   * @param {string} storeKey Key of the store to retrieve item from.
   * @param {string} itemKey Key of the item to retrieve.
   * @return {*}
   */
  getByKey(storeKey, itemKey) {
    return new Promise((resolve, reject) => {
      const txn = this[p.db].transaction([storeKey], 'readonly');
      txn.onerror = reject;
      txn.objectStore(storeKey).get(itemKey).onsuccess = (evt) => {
        resolve(evt.target.result);
      };
    });
  }

  /**
   * Adds/updates item to/in specified store.
   *
   * @param {string} storeKey Key of the store to save item to.
   * @param {string} itemKey Key of the item to save.
   * @param {*} itemData Item data to save.
   * @return {Promise}
   */
  set(storeKey, itemKey, itemData) {
    return new Promise((resolve, reject) => {
      const txn = this[p.db].transaction([storeKey], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      txn.objectStore(storeKey).put(itemData, itemKey);
    });
  }

  /**
   * Removes item from the specified store.
   *
   * @param {string} storeKey Key of the store to remove item from.
   * @param {string} itemKey Key of the item to remove.
   * @return {Promise}
   */
  remove(storeKey, itemKey) {
    return new Promise((resolve, reject) => {
      const txn = this[p.db].transaction([storeKey], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      txn.objectStore(storeKey).delete(itemKey);
    });
  }

  /**
   * Entirely clears specified store.
   *
   * @param {string} storeKey Key of the store to clear.
   * @return {Promise}
   */
  clear(storeKey) {
    return new Promise((resolve, reject) => {
      const txn = this[p.db].transaction([storeKey], 'readwrite');
      txn.oncomplete = resolve;
      txn.onerror = reject;
      txn.objectStore(storeKey).clear();
    });
  }

  /**
   * Clears all available stores.
   *
   * @return {Promise}
   */
  clearAll() {
    return new Promise((resolve, reject) => {
      this[p.db].close();

      const dbDeleteRequest = indexedDB.deleteDatabase(this[p.dbName]);
      dbDeleteRequest.onsuccess = resolve;
      dbDeleteRequest.onerror = reject;
      dbDeleteRequest.onblocked = reject;
    });
  }

  /**
   * Method that is called once IndexedDB upgrade is needed. Should be
   * overridden in classes that extend IndexedDbStorage class.
   *
   * @protected
   */
  onUpgradeNeeded() {
    throw new Error('Not implemented!');
  }
}
