import React from 'components/react';
import ReactDOM from 'components/react-dom';

import BaseController from './base';
import Services from '../views/services';

export default class ServicesController extends BaseController {
  main() {
    ReactDOM.render(React.createElement(Services, {
      foxbox: this.foxbox,
    }), this.mountNode);
  }
}
