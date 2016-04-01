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

describe('Camera service view tests', function () {
  let foxboxStub, serviceStub, component;

  before(function() {
    foxboxStub = sinon.stub({
      performSetOperation: () => {},
      performGetOperation: () => {}
    });

    serviceStub = sinon.stub({
      setters: {
        'fake-setter': {
          kind: 'Fake'
        },

        'setter-id': {
          kind: 'TakeSnapshot'
        }
      },
      getters: {
        'fake-getter': {
          kind: { kind: 'fake' }
        },

        'getter-id': {
          kind: { kind: 'latest image' }
        }
      },
      properties: {
        name: 'service-name'
      }
    });

    component = TestUtils.renderIntoDocument(
      <CameraServiceView service={serviceStub} foxbox={foxboxStub} />
    );
  });

  it('Renders itself in the correct state', function () {
    const header = TestUtils.findRenderedDOMComponentWithClass(
      component,
      'app-view__header'
    );

    assert.equal(serviceStub.properties.name, header.textContent);

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
    foxboxStub.performSetOperation
      .withArgs(serviceStub.setters['setter-id'])
      .returns(Promise.resolve());

    foxboxStub.performGetOperation.returns(Promise.reject('Wrong parameters'));
    foxboxStub.performGetOperation
      .withArgs(serviceStub.getters['getter-id'])
      .returns(Promise.resolve(new Blob([], { type: 'image/jpeg' })));

    const snapshotButton = TestUtils.findRenderedDOMComponentWithClass(
      component,
      'camera-controls__snapshot-btn'
    );

    TestUtils.Simulate.click(snapshotButton);

    // Wait until snapshot preview is ready.
    waitFor(() => !!component.refs.snapshotPreview.src)
      .then(() => {
        sinon.assert.calledWith(
          foxboxStub.performSetOperation, serviceStub.setters['setter-id'], ''
        );

        sinon.assert.calledWith(
          foxboxStub.performGetOperation, serviceStub.getters['getter-id']
        );

        assert.match(component.refs.snapshotPreview.src, /^blob:/);
      })
      .then(done, done);
  });
});
