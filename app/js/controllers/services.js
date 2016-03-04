/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import Services from 'js/views/services';

export default class ServicesController extends Controller {
  main() {
    this.foxbox.addEventListener('message', this.showMessage.bind(this));
    this.foxbox.addEventListener('dismiss-message', this.hideMessage.bind(this));

    this.view = ReactDOM.render(React.createElement(Services, { foxbox: this.foxbox }), this.mountNode);
  }

  teardown() {
    this.foxbox.removeEventListener('message', this.showMessage.bind(this));
    this.foxbox.removeEventListener('dismiss-message', this.hideMessage.bind(this));
  }

  showMessage(message) {
    this.view.setState({
      isModalVisible: true,
      title: message.title,
      body: message.body
    });
  }

  hideMessage() {
    this.view.setState({ isModalVisible: false });
  }
}
