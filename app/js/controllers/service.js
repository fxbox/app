import React from 'components/react';
import ReactDOM from 'components/react-dom';
import { Controller } from 'components/mvc';

import Service from '../views/service';

export default class ServiceController extends Controller {
  main(id) {
    ReactDOM.render(React.createElement(Service, {
      id,
      foxbox: this.foxbox,
    }), this.mountNode);
  }
}
