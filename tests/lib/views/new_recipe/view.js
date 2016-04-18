var View = require('../view');
var NewRecipeAccessors = require('./accessors');


function NewRecipeView() {
  [].push.call(arguments, NewRecipeAccessors);
  View.apply(this, arguments);

  this.accessors.doneButton; // Wait until it appears
}

NewRecipeView.prototype = Object.assign({

//to add functions here

}, View.prototype);
module.exports = NewRecipeView;
