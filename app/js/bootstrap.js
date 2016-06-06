/* eslint-env amd */

require.config({
  // ReactDOM expects "react" module to be defined, but it is not.
  map: { '*': { 'react': 'components/react' } },
});

const polyfills = [];

if (!('URLSearchParams' in self)) {
  polyfills.push('polyfills/url-search-params');
}

if (!('fetch' in self)) {
  polyfills.push('polyfills/fetch');
}

const polyfillsPromise = polyfills.length ?
  require(polyfills) : Promise.resolve();
polyfillsPromise.then(() => require(['js/app.js']));
