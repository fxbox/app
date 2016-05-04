'use strict';

const View = require('../view');
const RecipesAccessors = require('./accessors');


function RecipesView() {
  [].push.call(arguments, RecipesAccessors);
  View.apply(this, arguments);

  this.accessors.newRecipeButton; // Wait until it appears
}

RecipesView.prototype = Object.assign({

  goToNewRecipe() {
    return this.accessors.newRecipeButton.click().then(() => {
      const NewRecipeView = require('../new_recipe/view');
      return new NewRecipeView(this.driver);
    });
  },

}, View.prototype);

module.exports = RecipesView;
