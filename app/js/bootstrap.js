/* eslint-env amd */

require.config({
  // ReactDOM expects "react" module to be defined, but it is not.
  map: {
    '*': {
      'react': 'components/react'
    }
  }
});

require(['js/app.js']);
