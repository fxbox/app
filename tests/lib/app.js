'use strict';

const webdriver = require('selenium-webdriver');

const ASYNC_SCRIPT_TIMEOUT_IN_MS = 10000;

function App(driver, url) {
  this.driver = driver || new webdriver.Builder().forBrowser('firefox').build();
  this.driver.manage().timeouts().setScriptTimeout(ASYNC_SCRIPT_TIMEOUT_IN_MS);
  this.url = url || 'https://localhost:8000';
}

App.prototype = {
  init() {
    return this.driver.get(this.url)
      .then(() => {
        // Always set the fake registration server
        this.driver.executeScript(() => {
          // We want to update "registrationService" setting via localStorage,
          // but we're in the same window so "storage" event will never be
          // fired. To workaround this we just need to simulate "storage" event
          // with the required value.
          const storageEvent = new StorageEvent(
            'storage',
            {
              key: 'foxbox-registrationService',
              newValue: 'https://localhost:4455/ping',
              storageArea: window.localStorage,
            }
          );

          window.dispatchEvent(storageEvent);
        });
      })
      .then(() => this.defaultView);
  },

  cleanUp() {
    return this.driver.executeAsyncScript(() => {
      const callback = arguments[arguments.length - 1];
      window.foxbox.clear(true /* ignore sw */)
        .then(callback)
        .catch(callback);
    });
  },

  stop() {
    return this.driver.quit();
  },

  get defaultView() {
    const LoginView = require('./views/login/view');
    return new LoginView(this.driver);
  },
};

module.exports = App;
