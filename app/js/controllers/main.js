import { RoutingController } from 'components/fxos-mvc/dist/mvc';

import UsersController from 'js/controllers/users';
import ServicesController from 'js/controllers/services';
import ServiceController from 'js/controllers/service';
import ThemesController from 'js/controllers/themes';

import Foxbox from 'js/lib/foxbox/foxbox';
import Qr from 'js/lib/qr';

export default class MainController extends RoutingController {
  constructor() {
    const foxbox = new Foxbox();
    const mountNode = document.querySelector('.app-view-container');
    const options = { foxbox, mountNode };

    const usersController = new UsersController(options);
    const themesController = new ThemesController(options);

    super({
      '': usersController,
      'users/(.+)': usersController,
      'services': new ServicesController(options),
      'services/(.+)': new ServiceController(options),
      'themes': themesController,
      'themes/(.+)': themesController
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
    this.foxbox.init()
      .then(() => {
        if (this.foxbox.isLoggedIn) {
          if (location.hash === '') {
            location.hash = '#services';
          }
        } else {
          location.hash = '#users/login';
        }

        this.route();
      });
  }
}
