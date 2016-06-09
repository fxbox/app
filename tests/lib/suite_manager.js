'use strict';

const path = require('path');
const fs = require('fs');
const App = require('./app.js');


function getTestFiles() {
  const foldersPaths = ['common', 'integration']
    .map((folderName) => path.join(__dirname, `../${folderName}`));

  const testFiles = foldersPaths.map((folder) => {
    const files = fs.readdirSync(folder);
    const jsTestFiles = files.filter((file) => file.endsWith('_test.js'));
    const jsTestPaths = jsTestFiles
      .map((fileName) => path.join(folder, fileName));

    return jsTestPaths;
  });

  return [].concat.apply([], testFiles); // flatten
}

function loadAndExecuteSubSuite(filePath, initialView) {
  const subSuite = require(filePath);
  console.log('before calling it', initialView);
  subSuite.apply(null, [initialView]);
}

describe('', function() {
  this.timeout(120000);

  const app = new App();
  let loginView;
  const testFiles = getTestFiles();

  beforeEach(function() {
    return app.init()
      .then((defaultView) => {
        console.log('in then', defaultView);
        loginView = defaultView;
      });
  });

  testFiles.forEach(function(testFile) {
    loadAndExecuteSubSuite(testFile, loginView);
  });

  afterEach(function() {
    return app.cleanUp();
  });

  after(function() {
    return app.stop();
  });
});
