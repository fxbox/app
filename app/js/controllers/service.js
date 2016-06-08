import React from 'components/react';
import ReactDOM from 'components/react-dom';

import BaseController from './base';
import Service from '../views/service';

export default class ServiceController extends BaseController {
  main(id) {
    ReactDOM.render(React.createElement(Service, {
      id,
      foxbox: this.foxbox,
    }), this.mountNode);
  }
}
