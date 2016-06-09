'use strict';

const path = require('path');
const fs = require('fs');
const App = require('./app.js');


function SuiteManager() {
  this.subSuites = [];
  this.app = new App();
  this.numberOfTestFiles = countNumberOfTestFiles();
}

function countNumberOfTestFiles() {
  const foldersPaths = ['common', 'integration']
    .map((folderName) => path.join(__dirname, `../${folderName}`));

  const numberOfTestFilesPerFolder = foldersPaths.map((folder) => {
    const files = fs.readdirSync(folder);
    const jsTestFiles = files.filter((file) => file.endsWith('_test.js'));
    return jsTestFiles.length;
  });

  const numberOfTestFiles = numberOfTestFilesPerFolder
    .reduce((prev, curr) => prev + curr);

  return numberOfTestFiles;
}

SuiteManager.prototype = {
  registerSubSuite(subSuite) {
    this.subSuites.push(subSuite);
    if (this._areAllFilesLoaded()) {
      this._run();
    }
  },

  _areAllFilesLoaded() {
    return this.subSuites.length === this.numberOfTestFiles;
  },

  _run() {
    const self = this;

    describe('', function() {
      this.timeout(120000);

      let loginView;

      beforeEach(function() {
        return self.app.init()
          .then((defaultView) => {
            console.log('in then', defaultView);
            loginView = defaultView;
          });
      });

      describe('toto', function() {
        console.log('before subSuites', loginView);
        self.subSuites.forEach(function(subSuite) {
          subSuite(loginView);
        });
      });

      afterEach(function() {
        return self.app.cleanUp();
      });

      after(function() {
        return self.app.stop();
      });
    });
  },
};

const suiteManager = new SuiteManager();

module.exports = suiteManager;
