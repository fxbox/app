import { waitForNextMacroTask } from '../../test-utils';
import Network from 'js/lib/foxbox/network';

/** @test {Network} */
describe('Network >', function () {
  let settingsStub;

  beforeEach(function () {
    this.sinon = sinon.sandbox.create();
    this.sinon.useFakeTimers(Date.now());

    settingsStub = sinon.stub({
      session: 'fake_session',
      localOrigin: null,
      tunnelOrigin: null,
      onlineCheckingInterval: 2000,
      on: () => {},
    });

    this.sinon.stub(window, 'fetch').returns(Promise.resolve({ ok: true }));
  });

  afterEach(function() {
    this.sinon.restore();
    this.sinon = null;
  });

  /** @test {Network#init} */
  describe('init >', function() {
    let network;

    beforeEach(function() {
      network = new Network(settingsStub);
    });

    it('does not fetch any data if no origin is available', function(done) {
      network.init()
        .then(() => {
          sinon.assert.notCalled(window.fetch);
        })
        .then(done, done);
    });

    it('pings only local link if only "localOrigin" is provided',
    function(done) {
      settingsStub.localOrigin = 'http://x-fake-local.org';

      network.init()
        .then(() => {
          sinon.assert.calledOnce(window.fetch);
          sinon.assert.calledWith(
            window.fetch,
            'http://x-fake-local.org/ping',
            { cache: 'no-store' }
          );
        })
        .then(done, done);
    });

    it('pings only tunnel link if only "tunnelOrigin" is provided',
    function(done) {
      settingsStub.tunnelOrigin = 'http://x-fake-tunnel.org';

      network.init()
        .then(() => {
          sinon.assert.calledOnce(window.fetch);
          sinon.assert.calledWith(
            window.fetch,
            'http://x-fake-tunnel.org/ping',
            { cache: 'no-store' }
          );
        })
        .then(done, done);
    });

    it('pings both links if "tunnelOrigin" and "localOrigin" are provided',
    function(done) {
      settingsStub.localOrigin = 'http://x-fake-local.org';
      settingsStub.tunnelOrigin = 'http://x-fake-tunnel.org';

      network.init()
        .then(() => {
          sinon.assert.calledTwice(window.fetch);
          sinon.assert.calledWith(
            window.fetch,
            'http://x-fake-local.org/ping',
            { cache: 'no-store' }
          );
          sinon.assert.calledWith(
            window.fetch,
            'http://x-fake-tunnel.org/ping',
            { cache: 'no-store' }
          );
        })
        .then(done, done);
    });
  });

  describe('"online" status and origin change >', function() {
    let network;

    beforeEach(function(done) {
      network = new Network(settingsStub);

      network.init()
        .then(done, done);
    });

    it('"origin" is not accessible if links are unavailable', function() {
      assert.throws(() => network.origin);
    });

    it('"origin" is set to local one if local link is discovered',
    function(done) {
      const onOnline = sinon.stub();
      network.on('online', onOnline);

      assert.isFalse(network.online);

      settingsStub.localOrigin = 'http://x-fake-local.org';
      settingsStub.on.withArgs('local-origin').yield();

      assert.equal(network.origin, 'http://x-fake-local.org');

      // Let's wait for the ping response.
      waitForNextMacroTask()
        .then(() => {
          sinon.assert.calledOnce(window.fetch);
          sinon.assert.calledWith(
            window.fetch,
            'http://x-fake-local.org/ping',
            { cache: 'no-store' }
          );

          assert.isTrue(network.online);
          sinon.assert.calledOnce(onOnline);
          sinon.assert.calledWith(onOnline, true);
        })
        .then(done, done);
    });

    it('"origin" is set to tunnel one if only tunnel link is discovered',
    function(done) {
      const onOnline = sinon.stub();
      network.on('online', onOnline);

      assert.isFalse(network.online);

      settingsStub.tunnelOrigin = 'http://x-fake-tunnel.org';
      settingsStub.on.withArgs('tunnel-origin').yield();

      assert.equal(network.origin, 'http://x-fake-tunnel.org');

      // Let's wait for the ping response.
      waitForNextMacroTask()
        .then(() => {
          sinon.assert.calledOnce(window.fetch);
          sinon.assert.calledWith(
            window.fetch,
            'http://x-fake-tunnel.org/ping',
            { cache: 'no-store' }
          );

          assert.isTrue(network.online);
          sinon.assert.calledOnce(onOnline);
          sinon.assert.calledWith(onOnline, true);
        })
        .then(done, done);
    });

    it('"origin" is set to local one if both links are discovered',
    function(done) {
      const onOnline = sinon.stub();
      network.on('online', onOnline);

      assert.isFalse(network.online);

      settingsStub.localOrigin = 'http://x-fake-local.org';
      settingsStub.tunnelOrigin = 'http://x-fake-tunnel.org';
      settingsStub.on.withArgs('local-origin').yield();
      settingsStub.on.withArgs('tunnel-origin').yield();

      assert.equal(network.origin, 'http://x-fake-local.org');

      // Let's wait for the ping response.
      waitForNextMacroTask()
        .then(() => {
          sinon.assert.calledTwice(window.fetch);
          sinon.assert.calledWith(
            window.fetch,
            'http://x-fake-local.org/ping',
            { cache: 'no-store' }
          );
          sinon.assert.calledWith(
            window.fetch,
            'http://x-fake-tunnel.org/ping',
            { cache: 'no-store' }
          );

          assert.isTrue(network.online);
          sinon.assert.calledOnce(onOnline);
          sinon.assert.calledWith(onOnline, true);
        })
        .then(done, done);
    });

    it('if link is lost "origin" and "online" are correctly updated',
    function(done) {
      const onOnline = sinon.stub();

      settingsStub.localOrigin = 'http://x-fake-local.org';
      settingsStub.tunnelOrigin = 'http://x-fake-tunnel.org';
      settingsStub.on.withArgs('local-origin').yield();
      settingsStub.on.withArgs('tunnel-origin').yield();

      // Let's wait for the ping response to have both links ready.
      waitForNextMacroTask()
        .then(() => {
          assert.isTrue(network.online);
          assert.equal(network.origin, 'http://x-fake-local.org');

          network.on('online', onOnline);

          // Let's lose local link.
          settingsStub.localOrigin = null;
          settingsStub.on.withArgs('local-origin').yield();

          return waitForNextMacroTask();
        })
        .then(() => {
          // We're still online, but with new origin.
          assert.isTrue(network.online);
          assert.equal(network.origin, 'http://x-fake-tunnel.org');
          sinon.assert.notCalled(onOnline);

          // Let's lose tunnel link as well.
          settingsStub.tunnelOrigin = null;
          settingsStub.on.withArgs('tunnel-origin').yield();

          return waitForNextMacroTask();
        })
        .then(() => {
          // Now we should go offline and make "origin" inaccessible.
          assert.isFalse(network.online);
          assert.throws(() => network.origin);
          sinon.assert.calledOnce(onOnline);
          sinon.assert.calledWith(onOnline, false);
        })
        .then(done, done);
    });
  });
});
