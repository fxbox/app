var View = require('../view');
var ServicesAccessors = require('./accessors');


function ServicesView() {
  [].push.call(arguments, ServicesAccessors);
  View.apply(this, arguments);

  this.accessors.logOutButton; // Wait until it appears
}

ServicesView.prototype = Object.assign({

  logoutSuccess: function(password) {
    return this.accessors.logOutButton.click().then(() => {
      var LoginView = require('../login/view');
      return new LoginView(this.driver);
    });
  }

}, View.prototype);
module.exports = ServicesView;
