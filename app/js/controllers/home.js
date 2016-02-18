/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import HomeView from 'js/views/home';

export default class HomeController extends Controller {
  constructor(options) {
    super(options);

    this.mountNode = document.getElementById('main');
  }

  main() {
    this.hue.addEventListener('message', this.showMessage.bind(this));
    this.hue.addEventListener('dismiss-message', this.hideMessage.bind(this));

    this.view = ReactDOM.render(React.createElement(HomeView, {
      devices: [],
      hue: this.hue
    }), this.mountNode);

    this.hue.connectToBridge()
      .then(this.hue.getLights.bind(this.hue))
      .then(response => {
        console.log(response);
        this.view = ReactDOM.render(React.createElement(HomeView, {
          devices: response,
          hue: this.hue
        }), this.mountNode);
      })
      .catch(error => {
        console.error(error);
      });

    this.db.getRooms()
      .then(rooms => {
        console.log(rooms);
      })
      .catch(error => {
        console.error(error);
      });
  }

  teardown() {
    this.hue.removeEventListener('message', this.showMessage.bind(this));
    this.hue.removeEventListener('dismiss-message', this.hideMessage.bind(this));
  }

  showMessage(message) {
    this.view.setState({
      showModal: true,
      title: message.title,
      body: message.body
    });
  }

  hideMessage() {
    this.view.setState({ showModal: false });
  }
}
