/* eslint no-var: "off" */

var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    allTestFiles.push(file.replace(/^\/base\/|\.js$/g, ''));
  }
});

require.config({
  // Karma serves files under /base, which is the basePath from config file.
  baseUrl: '/base',
  deps: allTestFiles,
  callback: window.__karma__.start,

  // ReactDOM expects "react" module to be defined, but it is not.
  map: {
    '*': {
      'react': 'components/react',
    },
  },

  paths: {
    'js': 'dist/tests/unit',
    // Addons include React TestUtils.
    'components/react': 'node_modules/react/dist/react-with-addons',
    'components/react-dom': 'node_modules/react-dom/dist/react-dom',
    'rxjs': 'node_modules/rxjs/bundles/Rx.umd',
  },
});
