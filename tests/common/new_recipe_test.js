var App = require('../lib/app');

describe('Recipes tests', function() {
  var app;
  var loginView;
  var servicesGeneralView;
  this.timeout(30000);

  before(() => {
    app = new App();
    return app.init()
      .then(defaultView => { loginView = defaultView; })//;
      .then(() => { return loginView.loginSuccess(12345678);})
      .then(servicesView =>  
        { return servicesGeneralView = servicesView; });
  });

  afterEach(() => {
    return app.cleanUp();
  });

  after(() => {
    return app.stop();
  });

  it('should be able to start creating a new recipe', () => {
    return servicesGeneralView.goToRecipesView()
     .then(recipesView => {
       return recipesView.goToNewRecipe().tap; });
  });
});
