'use strict';

var App = require('../lib/app');

describe('Login', function() {
  var app;
  var loginView;
  this.timeout(30000);

  before(() => {
    app = new App();
    return app.init()
      .then(defaultView => { loginView = defaultView; });
  });

  after(() => {
    return app.stop();
  });

  it('should login', () => {
    return loginView.loginSuccess(12345678);
  });

});
