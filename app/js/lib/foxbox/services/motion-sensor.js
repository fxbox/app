'use strict';

import BaseService from './base';

const TYPE = 'motion-sensor';

const p = Object.freeze({
  onMotionStateChanged: Symbol('onMotionStateChanged'),
});

/**
 * Converts motion state value to boolean. Considers unknown state (null) the
 * same as state when motion is not detected.
 *
 * @param {Object} motionState Motion state object.
 * @return {boolean}
 * @private
 */
const motionStateToBoolean = function(motionState) {
  if (!motionState) {
    return false;
  }

  return motionState.OpenClosed === 'Open';
};

export default class MotionSensorService extends BaseService {
  constructor(props, api) {
    super(props, api, ['motion']);

    this[p.onMotionStateChanged] = this[p.onMotionStateChanged].bind(this);

    // Let's watch for motion sensor value changes.
    this.watch('OpenClosed', this[p.onMotionStateChanged]);

    Object.freeze(this);
  }

  get type() {
    return TYPE;
  }

  /**
   * Returns motion sensor state.
   *
   * @return {Promise.<boolean>}
   */
  isMotionDetected() {
    return this.get('OpenClosed').then(motionStateToBoolean);
  }

  /**
   * Removes motion sensor state watcher.
   */
  teardown() {
    super.teardown();

    this.unwatch('OpenClosed', this[p.onMotionStateChanged]);
  }

  /**
   * Function that is called whenever motion state changes.
   *
   * @param {Object} motionState State that indicates whether motion detected
   * or not.
   * @private
   */
  [p.onMotionStateChanged](motionState) {
    this.emit('motion', motionStateToBoolean(motionState));
  }
}
