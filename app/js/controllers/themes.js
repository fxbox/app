import React from 'components/react';
import ReactDOM from 'components/react-dom';

import BaseController from './base';
import Themes from '../views/themes';
import ThemesNew from '../views/themes-new';

export default class ThemesController extends BaseController {
  main(action = 'list') {
    const props = {
      foxbox: this.foxbox,
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
