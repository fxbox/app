/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import Service from 'js/views/service';

export default class ServiceController extends Controller {
  main(id) {
    ReactDOM.render(React.createElement(Service, {
      id,
      foxbox: this.foxbox
    }), this.mountNode);
  }
}
