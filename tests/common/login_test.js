'use strict';

module.exports = function(loginView) {
  describe('Login', function() {

    console.log('In login suite', loginView);

    it('should login', () => {
      console.log('in test');
      return loginView.loginSuccess(12345678);
    });

    // @todo Delete this test once a new one comes in. It was initially meant to
    // make sure the clean up was correctly made.
    it('should login a second time', () => loginView.loginSuccess(12345678));

  });
};
