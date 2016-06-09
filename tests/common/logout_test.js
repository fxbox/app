'use strict';

const app = require('../lib/app');

describe('Logout', function() {
  this.timeout(60000);

  let loginView;

  beforeEach(() => {
    return app.init()
      .then((defaultView) => { loginView = defaultView; });
  });

  it('should logout', () => {
    return loginView.loginSuccess(12345678)
      .then((servicesView) => servicesView.logoutSuccess());
  });
});
