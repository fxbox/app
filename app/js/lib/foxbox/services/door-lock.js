'use strict';

import BaseService from './base';

const TYPE = 'door-lock';

export default class DoorLockService extends BaseService {
  constructor(props, api) {
    super(props, api);
    Object.seal(this);
  }

  get type() {
    return TYPE;
  }

  /**
   * Checks if the lock is locked.
   *
   * @return {Promise.<boolean>}
   */
  isLocked() {
    return this.get('door/is-locked')
      .then((response) => {
        if (!response) {
          throw new Error('Door lock status is not available yet!');
        }

        return response.DoorLocked === 'Locked';
      });
  }

  /**
   * Either locks or unlocks the lock depending on the "locked" parameter.
   *
   * @param {boolean} locked Boolean value indicating whether we want lock or
   * unlock the lock.
   * @return {Promise}
   */
  lockUnlock(locked) {
    return this.set('door/is-locked', locked ? 'Locked': 'Unlocked');
  }
}
