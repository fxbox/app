'use strict';

const App = require('../lib/app');

describe('Logout', function() {
  let app;
  let loginView;
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
