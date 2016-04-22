var until = require('selenium-webdriver').until;

function Accessors(driver) {
  this.driver = driver;
}

Accessors.prototype = {
  waitForElement(locator) {
    var element = this.driver.wait(until.elementLocated(locator));
    return this.driver.wait(until.elementIsEnabled(element));
  },
};

module.exports = Accessors;
