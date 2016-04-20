import React from 'components/react';
import ReactDOM from 'components/react-dom';
import { Controller } from 'components/mvc';

import Services from 'js/views/services';

export default class ServicesController extends Controller {
  main() {
    ReactDOM.render(React.createElement(Services, {
      foxbox: this.foxbox,
    }), this.mountNode);
  }
}
