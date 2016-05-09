import Settings from 'js/lib/foxbox/settings';

/** @test {Settings} */
describe('Settings >', function () {
  let storageStub;
  beforeEach(function () {
    this.sinon = sinon.sandbox.create();

    storageStub = sinon.stub({
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
    });

    storageStub.getItem.returns(null);
    this.sinon.stub(window, 'addEventListener');
  });

  afterEach(function() {
    this.sinon.restore();
    this.sinon = null;
  });

  /** @test {Settings#constructor} */
  describe('constructor >', function() {
    it('correctly reads default values from localStorage', function() {
      storageStub.getItem
        .withArgs('foxbox-session')
        .returns('session-x');
      storageStub.getItem
        .withArgs('foxbox-servicePollingInterval')
        .returns('10000');

      const settings = new Settings(storageStub);

      assert.equal(settings.session, 'session-x');
      assert.equal(settings.servicePollingInterval, 10000);
    });

    it('correctly sets predefined default values', function() {
      const settings = new Settings(storageStub);

      assert.isNull(settings.session);
      assert.equal(settings.servicePollingInterval, 2000);
    });
  });

  describe('settings >', function() {
    let settings;

    beforeEach(function() {
      settings = new Settings(storageStub);
    });

    it('updated value is persisted in localStorage', function() {
      settings.session = 'x-session';

      sinon.assert.calledOnce(storageStub.setItem);
      sinon.assert.calledWith(
        storageStub.setItem,
        'foxbox-session',
        'x-session'
      );
      assert.equal(settings.session, 'x-session');

      settings.pushEndpoint = 'x-endpoint';

      sinon.assert.calledTwice(storageStub.setItem);
      sinon.assert.calledWith(
        storageStub.setItem,
        'foxbox-pushEndpoint',
        'x-endpoint'
      );
      assert.equal(settings.pushEndpoint, 'x-endpoint');
    });

    it('when default value is set it is removed from localStorage', function() {
      settings.session = 'x-session';
      settings.skipDiscovery = true;

      settings.session = null;

      sinon.assert.calledOnce(storageStub.removeItem);
      sinon.assert.calledWith(storageStub.removeItem, 'foxbox-session');
      assert.equal(settings.session, null);

      settings.skipDiscovery = false;

      sinon.assert.calledTwice(storageStub.removeItem);
      sinon.assert.calledWith(storageStub.removeItem, 'foxbox-skipDiscovery');
      assert.equal(settings.skipDiscovery, false);
    });

    it('event is emitted when setting value is changed', function() {
      const sessionEventHandler = sinon.stub();
      const pushEndpointEventHandler = sinon.stub();

      settings.on('session', sessionEventHandler);
      settings.on('push-endpoint', pushEndpointEventHandler);

      settings.session = 'x-session';

      sinon.assert.calledOnce(sessionEventHandler);
      sinon.assert.calledWith(sessionEventHandler, 'x-session');
      sinon.assert.notCalled(pushEndpointEventHandler);

      sessionEventHandler.reset();

      settings.pushEndpoint = 'x-endpoint';

      sinon.assert.calledOnce(pushEndpointEventHandler);
      sinon.assert.calledWith(pushEndpointEventHandler, 'x-endpoint');
      sinon.assert.notCalled(sessionEventHandler);

      pushEndpointEventHandler.reset();

      settings.session = null;

      sinon.assert.calledOnce(sessionEventHandler);
      sinon.assert.calledWith(sessionEventHandler, null);
      sinon.assert.notCalled(pushEndpointEventHandler);

      sessionEventHandler.reset();

      settings.pushEndpoint = null;
      sinon.assert.calledOnce(pushEndpointEventHandler);
      sinon.assert.calledWith(pushEndpointEventHandler, null);
      sinon.assert.notCalled(sessionEventHandler);
    });
  });

  describe('storage event >', function() {
    let settings;

    beforeEach(function() {
      settings = new Settings(storageStub);
    });

    it('unrelated storage events should not cause any change', function() {
      const sessionEventHandler = sinon.stub();

      settings.session = 'x-session';

      settings.on('session', sessionEventHandler);

      window.addEventListener.withArgs('storage').yield({
        key: 'session',
        newValue: 'x-new-session',
      });

      sinon.assert.notCalled(sessionEventHandler);
      assert.equal(settings.session, 'x-session');

      window.addEventListener.withArgs('storage').yield({
        key: 'foxbox-session-1',
        newValue: 'x-new-session',
      });

      sinon.assert.notCalled(sessionEventHandler);
      assert.equal(settings.session, 'x-session');
    });

    it('setting should be properly updated with new value', function() {
      const eventHandler = sinon.stub();

      settings.session = 'x-session';
      settings.skipDiscovery = false;
      settings.on('session', eventHandler);
      settings.on('skip-discovery', eventHandler);
      settings.on('watch-interval', eventHandler);

      assert.equal(settings.session, 'x-session');
      assert.equal(settings.skipDiscovery, false);
      assert.equal(settings.watchInterval, 3000);

      window.addEventListener.withArgs('storage').yield({
        key: 'foxbox-session',
        newValue: 'x-new-session',
      });

      assert.equal(settings.session, 'x-new-session');
      assert.equal(settings.skipDiscovery, false);
      assert.equal(settings.watchInterval, 3000);
      sinon.assert.calledOnce(eventHandler);
      sinon.assert.calledWith(eventHandler, 'x-new-session');

      eventHandler.reset();

      window.addEventListener.withArgs('storage').yield({
        key: 'foxbox-skipDiscovery',
        newValue: 'true',
      });

      assert.equal(settings.session, 'x-new-session');
      assert.equal(settings.skipDiscovery, true);
      assert.equal(settings.watchInterval, 3000);
      sinon.assert.calledOnce(eventHandler);
      sinon.assert.calledWith(eventHandler, true);

      eventHandler.reset();

      window.addEventListener.withArgs('storage').yield({
        key: 'foxbox-watchInterval',
        newValue: '5000',
      });

      assert.equal(settings.session, 'x-new-session');
      assert.equal(settings.skipDiscovery, true);
      assert.equal(settings.watchInterval, 5000);
      sinon.assert.calledOnce(eventHandler);
      sinon.assert.calledWith(eventHandler, 5000);
    });
  });
});
