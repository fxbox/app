'use strict';

import BaseService from './base';

const TYPE = 'motion-sensor';

export default class MotionSensorService extends BaseService {
  constructor(props, api) {
    super(props, api);
    Object.seal(this);
  }

  get type() {
    return TYPE;
  }
}
