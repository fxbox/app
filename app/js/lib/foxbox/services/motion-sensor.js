'use strict';

import BaseService from './base';

const TYPE = 'motion-sensor';

export default class MotionSensorService extends BaseService {
  constructor(props, config) {
    super(props, config);
    Object.seal(this);
  }

  get type() {
    return TYPE;
  }
}
