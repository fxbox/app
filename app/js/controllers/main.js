import { RoutingController } from 'components/fxos-mvc/dist/mvc';

import HomeController from 'js/controllers/home';
import ServiceController from 'js/controllers/service';

import Foxbox from 'js/lib/foxbox';

export default class MainController extends RoutingController {
  constructor() {
    const foxbox = new Foxbox();
    const mountNode = document.getElementById('main');
    const options = { foxbox, mountNode };
    super({
      'services': new HomeController(options),
      'services/(.+)': new ServiceController(options)
    });

    this.foxbox = foxbox;
  }

  main() {
    window.location.hash = '';
    this.foxbox.init()
      .then(() => {
        window.location.hash = '#services';
      });
  }
}
