'use strict';

const until = require('selenium-webdriver').until;


function Accessors(driver) {
  this.driver = driver;
}

Accessors.prototype = {
  waitForElement(locator) {
    const element = this.driver.wait(until.elementLocated(locator));
    return this.driver.wait(until.elementIsEnabled(element));
  },
};

module.exports = Accessors;
