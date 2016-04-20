import Rx from 'rxjs';
import React from 'components/react';

import CameraServiceView from 'js/views/services/camera';

// See capabilities at https://facebook.github.io/react/docs/test-utils.html
const TestUtils = React.addons.TestUtils;

function waitFor(fn) {
  return new Promise((resolve) => {
    Rx.Observable.interval(1)
      .filter(() => fn())
      .take(1)
      .subscribe(resolve);
  });
}

describe('Camera service view tests', function() {
  let foxboxStub, serviceMock, component;

  before(function() {
    foxboxStub = sinon.stub({});

    serviceMock = {
      takeSnapshot: () => Promise.resolve(new Blob([], { type: 'image/jpeg' })),
    };

    component = TestUtils.renderIntoDocument(
      <CameraServiceView service={serviceMock} foxbox={foxboxStub}/>
    );
  });

  it('Renders itself in the correct state', function() {
    const controls = TestUtils.findRenderedDOMComponentWithClass(
      component,
      'camera-controls'
    );

    // No preview by default.
    assert.isFalse(
      controls.classList.contains('camera-controls--has-preview')
    );

    // No previous snapshot by default.
    assert.isFalse(
      controls.classList.contains('camera-controls--has-previous-snapshot')
    );
  });

  it('Correctly calls foxbox to make a snapshot', function(done) {
    const snapshotButton = TestUtils.findRenderedDOMComponentWithClass(
      component,
      'camera-controls__snapshot-btn'
    );
    const serviceSpy = sinon.spy(serviceMock, 'takeSnapshot');

    TestUtils.Simulate.click(snapshotButton);

    // Wait until snapshot preview is ready.
    waitFor(() => !!component.refs.snapshotPreview.src)
      .then(() => {
        sinon.assert.called(serviceSpy);
        assert.match(component.refs.snapshotPreview.src, /^blob:/);
      })
      .then(done, done);
  });
});
