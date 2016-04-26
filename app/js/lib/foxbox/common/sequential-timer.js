'use strict';

const p = Object.freeze({
  started: Symbol('started'),
  nextTickHandle: Symbol('nextTickHandle'),

  // Private methods.
  scheduleTick: Symbol('scheduleTick'),
  onTick: Symbol('onTick'),
});

export default class SequentialTimer {
  /**
   * Creates new SequentialTimer instance.
   * @param {number} interval Minimum interval between two consequent ticks.
   */
  constructor(interval) {
    this.interval = interval;

    this[p.started] = false;
    this[p.nextTickHandle] = null;
    this[p.onTick] = null;

    Object.seal(this);
  }

  /**
   * Indicates whether timer started or not.
   *
   * @return {boolean}
   */
  get started() {
    return this[p.started];
  }

  /**
   * Starts timer. If timer has already been started nothing happens.
   * @param {function} onTick Function that will be called on every tick.
   */
  start(onTick) {
    if (this[p.started]) {
      console.warn('Timer has been already started.');
      return;
    }

    if (typeof onTick !== 'function') {
      throw new Error('onTick handler should be a valid function.');
    }

    this[p.started] = true;
    this[p.onTick] = onTick;

    this[p.scheduleTick]();
  }

  /**
   * Stops timer. If timer has not been started yet nothing happens.
   */
  stop() {
    if (!this[p.started]) {
      console.warn('Timer has not been started yet.');
      return;
    }

    this[p.started] = false;

    clearTimeout(this[p.nextTickHandle]);
    this[p.nextTickHandle] = null;
    this[p.onTick] = null;
  }

  /**
   * Schedules next tick.
   *
   * @private
   */
  [p.scheduleTick]() {
    if (!this[p.started] || this[p.nextTickHandle]) {
      return;
    }

    this[p.nextTickHandle] = setTimeout(() => {
      // Use Promise constructor to handle all possible results e.g. promises,
      // unexpected exceptions and any other non-promise values.
      (new Promise((resolve) => resolve(this[p.onTick]())))
        .catch((error) => {
          console.error(
            'onTick handler failed, scheduling next tick anyway: %o',
            error
          );
        })
        .then(() => {
          this[p.nextTickHandle] = null;
          this[p.scheduleTick]();
        });
    }, this.interval);
  }
}
