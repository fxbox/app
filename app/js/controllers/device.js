/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import DevicePage from 'js/views/device-page';

export default class DeviceController extends Controller {
  constructor(options) {
    super(options);

    this.mountNode = document.getElementById('main');
  }

  main(id) {
    // Get the light ID of the bulb on the bridge.
    this.db.getDevice(id)
      .then(response => {
        let lightId = response.data.lightId;

        // Request bulb details from the bridge given its light ID.
        this.hue.getLight(lightId)
          .then(response => {
            let props = response;
            props.lightId = lightId;
            props.db = this.db;
            props.hue = this.hue;
            this.view = ReactDOM.render(React.createElement(DevicePage, props), this.mountNode);
          });
      })
      .catch(error => {
        console.error(error);
      });
  }
}
