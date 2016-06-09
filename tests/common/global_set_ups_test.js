'use strict';

const app = require('../lib/app');

afterEach(function() {
  return app.cleanUp();
});

after(function() {
  return app.stop();
});
