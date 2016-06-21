import WebPush from 'js/lib/foxbox/webpush';

/** @test {WebPush} */
describe('WebPush >', function () {
  let apiStub, settingsStub, serviceWorkerReady, webPush;

  beforeEach(function () {
    this.sinon = sinon.sandbox.create();
    this.sinon.useFakeTimers();

    this.sinon.stub(navigator.serviceWorker, 'addEventListener');

    serviceWorkerReady = Promise.resolve();
    Object.defineProperty(navigator.serviceWorker, 'ready', {
      configurable: true,
      get: () => serviceWorkerReady,
    });

    settingsStub = sinon.stub({
      pushEndpoint: null,
      pushPubKey: null,
      pushAuth: null,
    });

    apiStub = sinon.stub({ put: () => {} });

    webPush = new WebPush(apiStub, settingsStub);
  });

  afterEach(function() {
    this.sinon.restore();
    this.sinon = null;
  });

  /** @test {WebPush#subscribeToNotifications} */
  describe('subscribeToNotifications >', function() {
    let subscriptionStub, registrationStub;

    beforeEach(function() {
      subscriptionStub = sinon.stub({
        endpoint: 'https://x-new-fake-endpoint.org',
        getKey: () => {},
      });
      subscriptionStub.getKey
        .withArgs('p256dh')
        .returns((new Uint8Array([1, 2, 3])).buffer);
      subscriptionStub.getKey
        .withArgs('auth')
        .returns((new Uint8Array([4, 5, 6])).buffer);

      registrationStub = {
        pushManager: sinon.stub({ subscribe: () => {} }),
      };
      registrationStub.pushManager.subscribe
        .withArgs({ userVisibleOnly: true })
        .returns(Promise.resolve(subscriptionStub));

      apiStub.put.returns(Promise.resolve());

      serviceWorkerReady = Promise.resolve(registrationStub);
    });

    it('does not re-register if push settings are already available',
    function(done) {
      settingsStub.pushEndpoint = 'https://x-fake-endpoint.org';
      settingsStub.pushPubKey = 'x-pub-key';
      settingsStub.pushAuth = 'x-auth';

      webPush.subscribeToNotifications()
        .then(() => {
          sinon.assert.notCalled(apiStub.put);
          assert.equal(
            settingsStub.pushEndpoint,
            'https://x-fake-endpoint.org'
          );
          assert.equal(settingsStub.pushPubKey, 'x-pub-key');
          assert.equal(settingsStub.pushAuth, 'x-auth');
        })
        .then(done, done);
    });

    it('initiates subscription request if there are no push settings available',
    function(done) {
      webPush.subscribeToNotifications()
        .then(() => {
          // Check that settings are correctly updated.
          assert.equal(
            settingsStub.pushEndpoint,
            'https://x-new-fake-endpoint.org'
          );
          assert.equal(settingsStub.pushPubKey, 'AQID');
          assert.equal(settingsStub.pushAuth, 'BAUG');

          // Check that we've correctly registered with foxbox.
          sinon.assert.calledTwice(apiStub.put);
          sinon.assert.calledWithExactly(
            apiStub.put,
            'channels/set',
            {
              select: {
                id: 'channel:subscribe.webpush@link.mozilla.org',
                feature: 'webpush/subscribe',
              },
              value: {
                subscriptions: [{
                  public_key: 'AQID',
                  push_uri: 'https://x-new-fake-endpoint.org',
                  auth: 'BAUG',
                }],
              },
            }
          );
          sinon.assert.calledWithExactly(
            apiStub.put,
            'channels/set',
            {
              select: {
                id: 'channel:resource.webpush@link.mozilla.org',
                feature: 'webpush/resource',
              },
              value: { resources: ['res1'] },
            }
          );
        })
        .then(done, done);
    });
  });
});
