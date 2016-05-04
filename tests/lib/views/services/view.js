'use strict';

const View = require('../view');
const ServicesAccessors = require('./accessors');


function ServicesView() {
  [].push.call(arguments, ServicesAccessors);
  View.apply(this, arguments);

  this.accessors.logOutButton;
  this.accessors.recipesViewButton; // Wait until it appears
}

ServicesView.prototype = Object.assign({
  logoutSuccess() {
    return this.accessors.logOutButton.click().then(() => {
      const LoginView = require('../login/view');
      return new LoginView(this.driver);
    });
  },

   goToRecipesView() {
    return this.accessors.recipesViewButton.click().then(() => {
      const RecipesView = require('../recipes/view');
      return new RecipesView(this.driver);
    });
  },
}, View.prototype);

module.exports = ServicesView;
