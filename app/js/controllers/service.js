/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import ServicePage from 'js/views/service-page';

export default class ServiceController extends Controller {
  main(id) {
    ReactDOM.render(React.createElement(ServicePage, {
      id: id,
      foxbox: this.foxbox
    }), this.mountNode);
  }
}
