import React from 'components/react';
import ReactDOM from 'components/react-dom';

import UserLogin from 'js/views/user-login';

// See capabilities at https://facebook.github.io/react/docs/test-utils.html
const TestUtils = React.addons.TestUtils;

const singleBox = [{
  public_ip: '1.1.1.1',
  client: 'abc',
  message: JSON.stringify({
    local_origin: 'https://local.abc.box.knilxof.org:3000',
    tunnel_origin: 'null',
  }),
  timestamp: Math.floor(Date.now() / 1000),
}];

const multiBox = singleBox.concat([
  {
    public_ip: '2.2.2.2',
    client: 'def',
    message: JSON.stringify({
      local_origin: 'http://local.def.box.knilxof.org:3000',
      tunnel_origin: 'null',
    }),
    timestamp: Math.floor(Date.now() / 1000),
  },
]);

describe('User login view tests', function() {
  let foxboxStub, component, renderedDOM;

  function getFoxboxStub(single = true) {
    foxboxStub = sinon.stub({
      boxes: single ? singleBox : multiBox,
      client: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      selectBox: () => {},
      login: () => {},
    });
  }

  it('Has no box selector when only one box is found', function() {
    getFoxboxStub();

    component = TestUtils.renderIntoDocument(<UserLogin foxbox={foxboxStub}/>);
    renderedDOM = () => ReactDOM.findDOMNode(component);

    const selects = renderedDOM().querySelectorAll('select');
    assert.lengthOf(selects, 0);
  });

  it('Has a box selector when more than one box is found', function() {
    getFoxboxStub(false);

    component = TestUtils.renderIntoDocument(<UserLogin foxbox={foxboxStub}/>);
    renderedDOM = () => ReactDOM.findDOMNode(component);

    const selects = renderedDOM().querySelectorAll('select');
    assert.lengthOf(selects, 1);
    assert.lengthOf(selects[0].childNodes, 2);
  });
});
