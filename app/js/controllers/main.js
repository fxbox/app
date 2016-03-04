import { RoutingController } from 'components/fxos-mvc/dist/mvc';

import UsersController from 'js/controllers/users';
import ServicesController from 'js/controllers/services';
import ServiceController from 'js/controllers/service';

import Foxbox from 'js/lib/foxbox';
import Qr from 'js/lib/qr';

export default class MainController extends RoutingController {
  constructor() {
    const foxbox = new Foxbox();
    const mountNode = document.getElementById('main');
    const options = { foxbox, mountNode };

    const usersController = new UsersController(options);
    super({
      'users': usersController,
      'users/(.+)': usersController,
      'services': new ServicesController(options),
      'services/(.+)': new ServiceController(options)
    });

    this.foxbox = foxbox;

    if (window.cordova) {
      // FIXME: Adding this to the `window` global for debugging, should
      // integrate this into the app's UI, see
      // https://github.com/fxbox/app/issues/6
      window.qr = new Qr();
    }
  }

  main() {
    window.location.hash = '';
    this.foxbox.init()
      .then(() => {
        if (this.foxbox.isLoggedIn) {
          window.location.hash = '#services';
        } else {
          window.location.hash = '#users/login';
        }
      });
  }
}
