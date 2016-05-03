import { RoutingController } from 'components/mvc';

import UsersController from 'js/controllers/users';
import ServicesController from 'js/controllers/services';
import ServiceController from 'js/controllers/service';
import ThemesController from 'js/controllers/themes';
import DevController from 'js/controllers/dev';

import Foxbox from 'js/lib/foxbox/foxbox';

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
      'themes/(.+)': themesController,
      'dev/(.+)/(.+)': new DevController(options),
    });

    this.foxbox = foxbox;
  }

  main() {
    this.foxbox.init()
      .then(() => {
        if (this.foxbox.isLoggedIn) {
          this.foxbox.subscribeToNotifications();

          // Let's schedule service list sync as soon as possible.
          this.foxbox.services.sync();

          if (location.hash === '') {
            location.hash = '#services';
          }

          this.foxbox.addEventListener('push-message', (msg) => {
            if (msg.action) {
              location.hash = msg.action;
            }
          });
        } else {
          location.hash = '#users/login';
        }

        this.route();
      });
  }
}
