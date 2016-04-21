var View = require('../view');
var ServicesAccessors = require('./accessors');


function ServicesView() {
  [].push.call(arguments, ServicesAccessors);
  View.apply(this, arguments);

  this.accessors.logOutButton;
  this.accessors.recipesViewButton; // Wait until it appears
}

ServicesView.prototype = Object.assign({
  logoutSuccess: function() {
    return this.accessors.logOutButton.click().then(() => {
      var LoginView = require('../login/view');
      return new LoginView(this.driver);
    });
  },

   goToRecipesView: function() {
    return this.accessors.recipesViewButton.click().then(() => {
      var RecipesView = require('../recipes/view');
      return new RecipesView(this.driver);
    });
  },
}, View.prototype);

module.exports = ServicesView;
