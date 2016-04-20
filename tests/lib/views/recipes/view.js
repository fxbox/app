var View = require('../view');
var RecipesAccessors = require('./accessors');


function RecipesView() {
  [].push.call(arguments, RecipesAccessors);
  View.apply(this, arguments);

  this.accessors.newRecipeButton; // Wait until it appears
}

RecipesView.prototype = Object.assign({

    goToNewRecipe: function() {
    return this.accessors.newRecipeButton.click().then(() => {
      var NewRecipeView = require('../new_recipe/view');
      return new NewRecipeView(this.driver);
    });
  },

}, View.prototype);

module.exports = RecipesView;
