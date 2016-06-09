'use strict';

const suiteManager = require('../lib/suite_manager.js');


suiteManager.registerSubSuite(function(loginView) {
  describe('Logout', function() {

    it('should logout', () => {
      return loginView.loginSuccess(12345678)
        .then((servicesView) => servicesView.logoutSuccess());
    });

  });
});
