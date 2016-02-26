import { RoutingController } from 'components/fxos-mvc/dist/mvc';

import HomeController from 'js/controllers/home';
import ServiceController from 'js/controllers/service';

import Foxbox from 'js/lib/foxbox';

import Settings from 'js/models/settings';
import Db from 'js/models/db';

export default class MainController extends RoutingController {
  constructor() {
    this.settings = new Settings();
    this.db = new Db();
    this.foxbox = new Foxbox();
    this.mountNode = document.getElementById('main');
    const options = {
      settings: this.settings,
      db: this.db,
      foxbox: this.foxbox,
      mountNode: this.mountNode
    };

    super({
      'services': new HomeController(options),
      'services/(.+)': new ServiceController(options)
    });
  }

  main() {
    window.location.hash = '';
    this.db.init()
      .then(() => {
        window.location.hash = '#services';
      });
  }
}
