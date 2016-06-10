import BaseController from './base';
import UsersController from './users';
import ServicesController from './services';
import ServiceController from './service';
import ServiceTagsController from './service-tags';
import ThemesController from './themes';
import DevController from './dev';

import Foxbox from '../lib/foxbox/foxbox';

const p = Object.freeze({
  controllers: Symbol('controllers'),
  onHashChanged: Symbol('onHashChanged'),
});

export default class MainController extends BaseController {
  constructor() {
    super();

    const foxbox = this.foxbox = new Foxbox();
    const mountNode = document.querySelector('.app-view-container');
    const options = { foxbox, mountNode };

    const usersController = new UsersController(options);
    const themesController = new ThemesController(options);

    this[p.controllers] = {
      '': usersController,
      'users/(.+)': usersController,
      'services': new ServicesController(options),
      'services/(.+)/tags': new ServiceTagsController(options),
      'services/(.+)': new ServiceController(options),
      'themes': themesController,
      'themes/(.+)': themesController,
      'dev/(.+)/(.+)': new DevController(options),
    };

    window.addEventListener('hashchange', this[p.onHashChanged].bind(this));
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

          this.foxbox.on('push-message', (msg) => {
            if (msg.action) {
              location.hash = msg.action;
            }
          });
        } else {
          location.hash = '#users/login';
        }

        this[p.onHashChanged]();
      });
  }

  /**
   * Handles hash change event and routes to the right controller.
   *
   * @private
   */
  [p.onHashChanged]() {
    const route = window.location.hash.slice(1);

    for (const routeName of Object.keys(this[p.controllers])) {
      const match = route.match(new RegExp(`^${routeName}$`));
      if (match) {
        this[p.controllers][routeName].main(...match.slice(1));
        break;
      }
    }
  }
}
