'use strict';

module.exports = function(loginView) {
  describe('Logout', function() {

    it('should logout', () => {
      return loginView.loginSuccess(12345678)
        .then((servicesView) => servicesView.logoutSuccess());
    });

  });
};
