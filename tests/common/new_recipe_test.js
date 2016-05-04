'use strict';

const App = require('../lib/app');

describe('Recipes tests', function() {
  let app;
  let loginView;
  let servicesGeneralView;
  this.timeout(30000);

  before(() => {
    app = new App();
    return app.init()
      .then((defaultView) => { loginView = defaultView; })
      .then(() => loginView.loginSuccess(12345678))
      .then((servicesView) => servicesGeneralView = servicesView);
  });

  afterEach(() => app.cleanUp());

  after(() => app.stop());

  it('should be able to start creating a new recipe', () => {
    return servicesGeneralView.goToRecipesView()
      .then((recipesView) => recipesView.goToNewRecipe().tap);
  });
});
