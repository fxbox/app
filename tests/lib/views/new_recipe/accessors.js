'use strict';

const By = require('selenium-webdriver').By;
const Accessors = require('../accessors');


function NewRecipeAccessors() {
  Accessors.apply(this, arguments);
}

NewRecipeAccessors.prototype = Object.assign({

  get doneButton() {
    return this.waitForElement(By.css('button.app-view__action'));
  },

}, Accessors.prototype);

module.exports = NewRecipeAccessors;
