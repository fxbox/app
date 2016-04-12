'use strict';

import BaseService from './base';

const TYPE = 'light';

export default class LightService extends BaseService {
  constructor(props, config) {
    super(props, config);
    Object.seal(this);
  }

  get type() {
    return TYPE;
  }

  isAvailable() {
    return this.get('available')
      .then((response) => response[Object.keys(response)[0]].OnOff === 'On');
  }

  isOn() {
    return this.get('LightOn')
      .then((response) => response[Object.keys(response)[0]].OnOff === 'On');
  }

  /**
   * Turn the bulb on or off.
   *
   * @param {boolean} on Whether to turn it on (true) or off (false).
   * @return {Promise}
   */
  turn(on) {
    const value = on ? 'On' : 'Off';
    return this.set('LightOn', value);
  }
}
