'use strict';

const app = require('../lib/app');

describe('Recipes tests', function() {
  this.timeout(60000);

  let servicesGeneralView;

  beforeEach(() => {
    return app.init()
      .then((loginView) => loginView.loginSuccess(12345678))
      .then((servicesView) => servicesGeneralView = servicesView);
  });

  it('should be able to start creating a new recipe', () => {
    return servicesGeneralView.goToRecipesView()
      .then((recipesView) => recipesView.goToNewRecipe().tap);
  });
});
