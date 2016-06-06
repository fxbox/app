import React from 'components/react';
import ReactDOM from 'components/react-dom';
import { Controller } from 'components/mvc';

import ServiceTagsView from '../views/service-tags';

export default class ServiceTagsController extends Controller {
  main(id) {
    ReactDOM.render(React.createElement(ServiceTagsView, {
      id,
      foxbox: this.foxbox,
    }), this.mountNode);
  }
}
