/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import Services from 'js/views/services';

export default class ServicesController extends Controller {
  main() {
    ReactDOM.render(React.createElement(Services, {
      foxbox: this.foxbox
    }), this.mountNode);
  }
}
