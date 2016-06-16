'use strict';

const p = Object.freeze({ db: Symbol('db') });

export default class InMemoryStorage {
  constructor() {
    this[p.db] = new Map();
  }

  /**
   * Gets all items from the specified store.
   *
   * @param {string} storeKey Key of the store to retrieve all items from.
   * @return {Promise.<Array>}
   */
  getAll(storeKey) {
    const store = this[p.db].get(storeKey);

    return Promise.resolve(store ? Array.from(store.values()) : []);
  }

  /**
   * Returns single item from the specified store by item's key.
   *
   * @param {string} storeKey Key of the store to retrieve item from.
   * @param {string} itemKey Key of the item to retrieve.
   * @return {*}
   */
  getByKey(storeKey, itemKey) {
    const store = this[p.db].get(storeKey);

    if (!store || store.has(itemKey)) {
      return Promise.reject(
        new Error(`There is no item (${itemKey}) in the store (${storeKey}).`)
      );
    }

    return Promise.resolve(store.get(itemKey));
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
    let store = this[p.db].get(storeKey);

    if (!store) {
      this[p.db].set(storeKey, (store = new Map()));
    }

    store.set(itemKey, itemData);

    return Promise.resolve();
  }

  /**
   * Removes item from the specified store.
   *
   * @param {string} storeKey Key of the store to remove item from.
   * @param {string} itemKey Key of the item to remove.
   * @return {Promise}
   */
  remove(storeKey, itemKey) {
    const store = this[p.db].get(storeKey);

    if (store) {
      store.delete(itemKey);
    }

    return Promise.resolve();
  }

  /**
   * Entirely clears specified store.
   *
   * @param {string} storeKey Key of the store to clear.
   * @return {Promise}
   */
  clear(storeKey) {
    const store = this[p.db].get(storeKey);

    if (store) {
      store.clear();
    }

    return Promise.resolve();
  }

  /**
   * Clears all available stores.
   *
   * @return {Promise}
   */
  clearAll() {
    return Promise.resolve(this[p.db].clear());
  }
}
