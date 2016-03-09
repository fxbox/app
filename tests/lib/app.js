var webdriver = require('selenium-webdriver');


function App(driver, url) {
  this.driver = driver || new webdriver.Builder().forBrowser('firefox').build();
  this.url = url || 'http://localhost:8000';
}

App.prototype = {
  init: function() {
    return this.driver.get(this.url)
      .then(() => this.defaultView);
  },

  stop: function() {
    return this.driver.quit();
  },

  get defaultView() {
    var LoginView = require('./views/login/view');
    return new LoginView(this.driver);
  }
};

module.exports = App;
