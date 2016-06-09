'use strict';

const app = require('../lib/app');

describe('Login', function() {
  this.timeout(60000);

  let loginView;

  beforeEach(() => {
    return app.init()
      .then((defaultView) => { loginView = defaultView; });
  });

  it('should login', () => loginView.loginSuccess(12345678));

  // @todo Delete this test once a new one comes in. It was initially meant to
  // make sure the clean up was correctly made.
  it('should login a second time', () => loginView.loginSuccess(12345678));
});
