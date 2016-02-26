/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import HomeView from 'js/views/home';

export default class HomeController extends Controller {
  main() {
    this.foxbox.addEventListener('message', this.showMessage.bind(this));
    this.foxbox.addEventListener('dismiss-message', this.hideMessage.bind(this));

    this.view = ReactDOM.render(React.createElement(HomeView, {
      services: [],
      foxbox: this.foxbox
    }), this.mountNode);

    this.foxbox.getServices()
      .then(services => {
        console.log(services);
        this.view = ReactDOM.render(React.createElement(HomeView, {
          services: services,
          foxbox: this.foxbox
        }), this.mountNode);

        // Clear the services db.
        this.db.clearServices()
          .then(() => {
            // Populate the db with the latest services.
            services.forEach(service => {
              this.db.setService(service);
            });
          });
      })
      .catch(console.error.bind(console));

    /*this.db.getTags()
      .then(tags => {
        console.log(tags);
      })
      .catch(console.error.bind(console));*/
  }

  teardown() {
    this.foxbox.removeEventListener('message', this.showMessage.bind(this));
    this.foxbox.removeEventListener('dismiss-message', this.hideMessage.bind(this));
  }

  showMessage(message) {
    this.view.setState({
      visible: true,
      title: message.title,
      body: message.body
    });
  }

  hideMessage() {
    this.view.setState({ visible: false });
  }
}
