var By = require('selenium-webdriver').By;
var Accessors = require('../accessors');


function RecipesAccessors() {
  Accessors.apply(this, arguments);
}

RecipesAccessors.prototype = Object.assign({
  get newRecipeButton() {
    return this.waitForElement(By.css('img.app-view__action-icon'));
  }

}, Accessors.prototype);

module.exports = RecipesAccessors;
