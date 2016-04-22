'use strict';

var App = require('../lib/app');

describe('Logout', function() {
  var app;
  var loginView;
  this.timeout(30000);

  before(() => {
    app = new App();
    return app.init()
      .then((defaultView) => { loginView = defaultView; });
  });

  after(() => app.stop());

  it('should logout', () => {
    return loginView.loginSuccess(12345678)
      .then((servicesView) => servicesView.logoutSuccess());
  });
});
