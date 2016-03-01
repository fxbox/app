import { RoutingController } from 'components/fxos-mvc/dist/mvc';

import HomeController from 'js/controllers/home';
import ServiceController from 'js/controllers/service';

import Foxbox from 'js/lib/foxbox';
import Qr from 'js/lib/qr';

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
    if (window.cordova) {
      // FIXME: Adding this to the `window` global for debugging, should
      // integrate this into the app's UI, see
      // https://github.com/fxbox/app/issues/6
      window.qr = new Qr();
    }
    this.foxbox.init()
      .then(() => {
        window.location.hash = '#services';
      });
  }
}
