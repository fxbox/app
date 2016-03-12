var By = require('selenium-webdriver').By;
var Accessors = require('../accessors');


function LoginAccessors() {
  Accessors.apply(this, arguments);
}

LoginAccessors.prototype = Object.assign({

  get startLoginButton() {
    return this.waitForElement(By.css('.user-login__login-button'));
  },

  get passwordField() {
    return this.waitForElement(By.id('signin-pwd'));
  },

  get submitButton() {
    return this.waitForElement(By.id('signin-button'));
  }
}, Accessors.prototype);

module.exports = LoginAccessors;
