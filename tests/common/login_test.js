'use strict';

var App = require('../lib/app');

describe('Login', function() {
  var app;
  var loginView;
  this.timeout(30000);

  before(() => {
    app = new App();
  });

  beforeEach(() => {
    return app.init()
      .then((defaultView) => { loginView = defaultView; });
  });

  afterEach(() => {
    return app.cleanUp();
  });

  after(() => {
    return app.stop();
  });

  it('should login', () => {
    return loginView.loginSuccess(12345678);
  });

  // TODO: Delete this test once a new one comes in. It was initially meant to
  // make sure the clean up was correctly made.
  it('should login a second time', () => {
    return loginView.loginSuccess(12345678);
  });
});
