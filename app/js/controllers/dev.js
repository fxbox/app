import React from 'components/react';
import ReactDOM from 'components/react-dom';

import BaseController from './base';
import CameraLatestImageView from '../views/dev/camera-latest-image';

export default class DevController extends BaseController {
  main(path, args) {
    switch (path) {
      case 'camera-latest-image':
        ReactDOM.render(React.createElement(CameraLatestImageView, {
          id: args,
          foxbox: this.foxbox,
        }), this.mountNode);
        break;
      default:
        console.error('Unknown development view path "%s"', path);
        break;
    }
  }
}
