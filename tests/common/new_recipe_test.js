'use strict';

module.exports = function(loginView) {
  describe('Recipes tests', function() {
    let servicesGeneralView;

    before(() => {
      return loginView.loginSuccess(12345678)
        .then((servicesView) => servicesGeneralView = servicesView);
    });

    it('should be able to start creating a new recipe', () => {
      return servicesGeneralView.goToRecipesView()
        .then((recipesView) => recipesView.goToNewRecipe().tap);
    });
  });
};
