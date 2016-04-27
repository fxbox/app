'use strict';

import BaseService from './base';

const TYPE = 'ip-camera';

export default class IpCameraService extends BaseService {
  constructor(props, api) {
    super(props, api);
    Object.seal(this);
  }

  get type() {
    return TYPE;
  }

  getLatestImage() {
    return this.get('latest image');
  }

  takeSnapshot() {
    return this.set('TakeSnapshot')
      .then(() => this.get('latest image'));
  }
}
