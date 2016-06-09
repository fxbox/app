'use strict';

const fs = require('fs');
const path = require('path');
const base64 = require('base64-js');
const webdriver = require('selenium-webdriver');
const firefoxCapabilities = require('selenium-webdriver/lib/capabilities')
  .Capabilities.firefox();

firefoxCapabilities.set('marionette', true);

const zippedProfile = fs.readFileSync(path.join(__dirname, 'profile.zip'));
const encodedProfile = base64.fromByteArray(zippedProfile);
firefoxCapabilities.set('firefox_profile', encodedProfile);
const driverBuilder = new webdriver.Builder()
  .withCapabilities(firefoxCapabilities);

function App(url) {
  this.driver = driverBuilder.build();
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

const app = new App();

module.exports = app;
