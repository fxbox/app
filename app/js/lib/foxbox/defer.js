'use strict';

const p = Object.freeze({
  promise: Symbol('promise'),
  resolve: Symbol('resolve'),
  reject: Symbol('reject'),
});

/**
 * Instance of the Defer class is just a handy wrapper around native Promise
 * object intended to provide dedicated 'resolve' and 'reject' methods.
 */
export default class Defer {
  constructor() {
    this[p.promise] = new Promise((resolve, reject) => {
      this[p.resolve] = resolve;
      this[p.reject] = reject;
    });

    Object.freeze(this);
  }

  /**
   * Actual promise instance.
   *
   * @return {Promise}
   */
  get promise() {
    return this[p.promise];
  }

  /**
   * Resolves promise with the specified value.
   *
   * @param {*=} value Optional value to resolve promise with.
   */
  resolve(value) {
    this[p.resolve](value);
  }

  /**
   * Rejects promise with the specified error.
   *
   * @param {*=} error Error to reject promise with.
   */
  reject(error) {
    this[p.reject](error);
  }
}
