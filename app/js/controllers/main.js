import { RoutingController } from 'components/fxos-mvc/dist/mvc';

import HomeController from 'js/controllers/home';
import DeviceController from 'js/controllers/device';

import Hue from 'js/lib/hue';

import Settings from 'js/models/settings';
import Db from 'js/models/db';

export default class MainController extends RoutingController {
  constructor() {
    this.settings = new Settings();
    this.db = new Db();
    this.hue = new Hue(this.settings);
    let options = { settings: this.settings, db: this.db, hue: this.hue };

    super({
      'home': new HomeController(options),
      'home/device/(.+)': new DeviceController(options)
    });
  }

  main() {
    window.location.hash = '';
    this.db.init()
      .then(() => {
        window.location.hash = '#home';
      });
  }
}
