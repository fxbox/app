/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import ServicePage from 'js/views/service-page';

export default class ServiceController extends Controller {
  main(id) {
    this.foxbox.getService(id)
      .then(service => {
        let props = service;
        props.foxbox = this.foxbox;
        this.view = ReactDOM.render(React.createElement(ServicePage, props), this.mountNode);
      })
      .catch(console.error.bind(console));
  }
}
