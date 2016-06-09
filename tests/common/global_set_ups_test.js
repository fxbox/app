'use strict';

const app = require('../lib/app');

console.log(this);

afterEach(function() {
  return app.cleanUp();
});

after(function() {
  return app.stop();
});
