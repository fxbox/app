/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import HomeView from 'js/views/home';

export default class HomeController extends Controller {
  main() {
    this.hue.addEventListener('message', this.showMessage.bind(this));
    this.hue.addEventListener('dismiss-message', this.hideMessage.bind(this));

    this.view = ReactDOM.render(React.createElement(HomeView, {
      devices: [],
      hue: this.hue
    }), this.mountNode);

    this.hue.connectToBridge()
      .then(this.hue.getLights.bind(this.hue))
      .then(devices => {
        console.log(devices);
        this.view = ReactDOM.render(React.createElement(HomeView, {
          devices: devices,
          hue: this.hue
        }), this.mountNode);

        devices.forEach((device, id) => {
          let lightId = (id + 1);

          this.db.getDevice(device.uniqueid)
            .then(deviceData => {
              if (!deviceData) {
                this.db.setDevice({
                  id: device.uniqueid,
                  lightId: lightId
                });
              } else {
                deviceData.data.lightId = lightId; // In case the id changed.
                this.db.setDevice(deviceData.data);
              }
            });
        });
      })
      .catch(error => {
        console.error(error);
      });

    this.db.getTags()
      .then(tags => {
        console.log(tags);
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
      visible: true,
      title: message.title,
      body: message.body
    });
  }

  hideMessage() {
    this.view.setState({ visible: false });
  }
}
