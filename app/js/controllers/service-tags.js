import React from 'components/react';
import ReactDOM from 'components/react-dom';

import BaseController from './base';
import ServiceTagsView from '../views/service-tags';

export default class ServiceTagsController extends BaseController {
  main(id) {
    ReactDOM.render(React.createElement(ServiceTagsView, {
      id,
      foxbox: this.foxbox,
    }), this.mountNode);
  }
}
