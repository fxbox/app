'use strict';

import BaseService from './base';

const TYPE = 'light';

export default class LightService extends BaseService {
  constructor(props, api) {
    super(props, api);
    Object.seal(this);
  }

  get type() {
    return TYPE;
  }

  isAvailable() {
    return this.get('device/available')
      .then((response) => response.OnOff === 'On');
  }

  isOn() {
    return this.get('light/is-on')
      .then((response) => response.OnOff === 'On');
  }

  /**
   * Turn the bulb on or off.
   *
   * @param {boolean} on Whether to turn it on (true) or off (false).
   * @return {Promise}
   */
  turn(on) {
    return this.set('light/is-on', on ? 'On' : 'Off');
  }
}
