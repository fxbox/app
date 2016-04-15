import React from 'components/react';
import ReactDOM from 'components/react-dom';
import { Controller } from 'components/mvc';

import CameraLatestImageView from 'js/views/dev/camera-latest-image';

export default class DevController extends Controller {
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
