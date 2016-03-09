var View = require('../view');
var LoginAccessors = require('./accessors');


function LoginView() {
  [].push.call(arguments, LoginAccessors);
  View.apply(this, arguments);
}

LoginView.prototype = Object.assign({

  loginSuccess: function(password) {
    return this.accessors.startLoginButton.click().then(() => {
      this.accessors.passwordField.sendKeys(password);
      this.accessors.submitButton.click();
    }).then(() => {
      return new require('../services/view')(this.driver);
    });
  }

}, View.prototype);

module.exports = LoginView;
