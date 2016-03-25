/* global React, ReactDOM */

import { Controller } from 'components/fxos-mvc/dist/mvc';

import Themes from 'js/views/themes';
import ThemesNew from 'js/views/themes-new';

export default class ThemesController extends Controller {
  main(action = 'list') {
    const props = {
      foxbox: this.foxbox
    };

    switch (action) {
      case 'list':
        ReactDOM.render(React.createElement(Themes, props), this.mountNode);
        break;

      case 'new':
        ReactDOM.render(React.createElement(ThemesNew, props), this.mountNode);
        break;

      default:
        //ReactDOM.render(React.createElement(Theme, props), this.mountNode);
        break;
    }

  }
}
