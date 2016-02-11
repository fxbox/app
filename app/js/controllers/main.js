import { RoutingController } from 'components/fxos-mvc/dist/mvc';

import HomeController from 'js/controllers/home';

import Settings from 'js/models/settings';
import Db from 'js/models/db';

export default class MainController extends RoutingController {
  constructor() {
    this.settings = new Settings();
    this.db = new Db();
    let options = { settings: this.settings, db: this.db };

    super({
      home: new HomeController(options)
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
