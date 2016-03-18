var webdriver = require('selenium-webdriver');

const ASYNC_SCRIPT_TIMEOUT_IN_MS = 10000;

function App(driver, url) {
  this.driver = driver || new webdriver.Builder().forBrowser('firefox').build();
  this.driver.manage().timeouts().setScriptTimeout(ASYNC_SCRIPT_TIMEOUT_IN_MS);
  this.url = url || 'http://localhost:8000';
}

App.prototype = {
  init: function() {
    return this.driver.get(this.url)
      .then(() => {
        // Always set the fake registration server
        this.driver.executeScript(() => {
          localStorage.registrationServer = 'http://localhost:4455/ping';
        });
      })
      .then(() => this.defaultView);
  },

  cleanUp: function() {
    return this.driver.executeAsyncScript(() => {
      var callback = arguments[arguments.length - 1];
      window.foxbox.clear()
        .then(callback)
        .catch(callback);
    });
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
