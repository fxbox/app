var View = require('../view');
var LoginAccessors = require('./accessors');


function LoginView() {
  [].push.call(arguments, LoginAccessors);
  View.apply(this, arguments);

  this.accessors.startLoginButton;
}

LoginView.prototype = Object.assign({

  loginSuccess: function(password) {
    return this.accessors.startLoginButton.click().then(() => {
      this.accessors.passwordField.sendKeys(password);
      this.accessors.submitButton.click();
    }).then(() => {
      var ServicesView = require('../services/view');
      return new ServicesView(this.driver);
    });
  },

}, View.prototype);

module.exports = LoginView;
