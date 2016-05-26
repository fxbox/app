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
    super(props, api, undefined, new Map([
      ['motion', ['door/is-open', p.onMotionStateChanged]],
    ]));

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
    return this.get('door/is-open').then(motionStateToBoolean);
  }

  /**
   * Function that is called whenever motion state changes. It is intended to
   * convert raw getter value into simple boolean.
   *
   * @param {Object} motionState State that indicates whether motion detected
   * or not.
   * @return {boolean}
   * @private
   */
  [p.onMotionStateChanged](motionState) {
    return motionStateToBoolean(motionState);
  }
}
