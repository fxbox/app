/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import UserLogin from 'js/views/user-login';

const ALLOWED_ACTIONS = ['login', 'logout'];
const DEFAULT_ACTION = ALLOWED_ACTIONS[0];

export default class UsersController extends Controller {
  main(action = DEFAULT_ACTION) {
    if (!ALLOWED_ACTIONS.includes(action)) {
      console.error(`Bad users route: "${action}". Falling back to ${DEFAULT_ACTION}.`);
      action = DEFAULT_ACTION;
    }

    switch (action) {
      case 'login':
        this.login();
        break;

      case 'logout':
        this.logout();
        break;
    }
  }

  login() {
    ReactDOM.render(React.createElement(UserLogin, { foxbox: this.foxbox }), this.mountNode);
  }

  logout() {
    this.foxbox.logout();

    // Once logged out, we redirect to the login page.
    location.hash = '#users/login';
  }
}
