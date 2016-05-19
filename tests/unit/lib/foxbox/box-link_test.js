import { waitForNextMacroTask } from '../../test-utils';
import Defer from 'js/lib/foxbox/common/defer';
import BoxLink from 'js/lib/foxbox/box-link';

/** @test {BoxLink} */
describe('BoxLink >', function () {
  let isDocumentHidden;

  beforeEach(function () {
    this.sinon = sinon.sandbox.create();
    this.sinon.useFakeTimers(Date.now());

    isDocumentHidden = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => isDocumentHidden,
    });

    this.sinon.stub(window, 'fetch').returns(Promise.resolve({ ok: true }));
  });

  afterEach(function() {
    this.sinon.restore();
    this.sinon = null;
  });

  /** @test {BoxLink#constructor} */
  describe('constructor >', function() {
    it('throws if origin is not provided', function() {
      assert.throws(() => new BoxLink());
      assert.throws(() => new BoxLink(''));
    });

    it('correctly sets up properties', function() {
      const boxLink = new BoxLink('https://box-fake.org');

      assert.equal(boxLink.origin, 'https://box-fake.org');
      assert.isFalse(boxLink.online);
    });
  });

  /** @test {BoxLink#ping} */
  describe('ping >', function() {
    let boxLink;

    beforeEach(function() {
      boxLink = new BoxLink('https://box-fake.org');
    });

    it('forces and does not throttle ping network requests', function() {
      Array.from({ length: 3 }).forEach(() => {
        boxLink.ping();
      });

      sinon.assert.calledThrice(window.fetch);
      sinon.assert.calledWith(
        window.fetch,
        'https://box-fake.org/ping',
        { cache: 'no-store' }
      );
    });

    it('correctly sets "online" status with valid response', function(done) {
      const onOnline = sinon.stub();
      boxLink.on('online', onOnline);

      assert.isFalse(boxLink.online);

      boxLink.ping()
        .then((isOnline) => {
          assert.isTrue(isOnline);
          assert.isTrue(boxLink.online);

          sinon.assert.calledOnce(onOnline);
          sinon.assert.calledWith(onOnline, true);

          // Now go offline with valid, but non-200 response.
          window.fetch.withArgs('https://box-fake.org/ping').returns(
            Promise.resolve({ ok: false })
          );

          return boxLink.ping();
        })
        .then((isOnline) => {
          assert.isFalse(isOnline);
          assert.isFalse(boxLink.online);

          sinon.assert.calledTwice(onOnline);
          sinon.assert.calledWith(onOnline, false);
        })
        .then(done, done);
    });

    it('correctly sets "online" status with invalid response', function(done) {
      const onOnline = sinon.stub();
      boxLink.on('online', onOnline);

      assert.isFalse(boxLink.online);

      boxLink.ping()
        .then((isOnline) => {
          assert.isTrue(isOnline);
          assert.isTrue(boxLink.online);

          sinon.assert.calledOnce(onOnline);
          sinon.assert.calledWith(onOnline, true);

          // Now go offline with invalid response.
          window.fetch.withArgs('https://box-fake.org/ping').returns(
            Promise.reject()
          );

          return boxLink.ping();
        })
        .then((isOnline) => {
          assert.isFalse(isOnline);
          assert.isFalse(boxLink.online);

          sinon.assert.calledTwice(onOnline);
          sinon.assert.calledWith(onOnline, false);
        })
        .then(done, done);
    });

    it('should perform network request even if document is hidden', function() {
      isDocumentHidden = true;

      boxLink.ping();

      sinon.assert.calledOnce(window.fetch);
      sinon.assert.calledWith(
        window.fetch,
        'https://box-fake.org/ping',
        { cache: 'no-store' }
      );

      isDocumentHidden = false;

      boxLink.ping();

      sinon.assert.calledTwice(window.fetch);
    });
  });

  /** @test {BoxLink#enableAutoPing} */
  describe('enableAutoPing >', function() {
    let boxLink;

    beforeEach(function() {
      boxLink = new BoxLink('https://box-fake.org');
    });

    it('throws if interval is not a valid positive number', function() {
      assert.throws(() => boxLink.enableAutoPing());
      assert.throws(() => boxLink.enableAutoPing('2000'));
      assert.throws(() => boxLink.enableAutoPing(-2000));
    });

    it('pings only using specified interval', function(done) {
      boxLink.enableAutoPing(2000);

      this.sinon.clock.tick(1999);

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.notCalled(window.fetch);
          assert.isFalse(boxLink.online);

          this.sinon.clock.tick(1);

          return waitForNextMacroTask();
        })
        .then(() => {
          sinon.assert.calledOnce(window.fetch);
          sinon.assert.calledWith(
            window.fetch,
            'https://box-fake.org/ping',
            { cache: 'no-store' }
          );
        })
        .then(done, done);
    });

    it('pings again only once previous ping is completed', function(done) {
      const pingNetworkDefer = new Defer();
      window.fetch
        .withArgs('https://box-fake.org/ping')
        .returns(pingNetworkDefer.promise);

      boxLink.enableAutoPing(2000);

      this.sinon.clock.tick(2000);

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.calledOnce(window.fetch);
          sinon.assert.calledWith(
            window.fetch,
            'https://box-fake.org/ping',
            { cache: 'no-store' }
          );

          assert.isFalse(boxLink.online);

          this.sinon.clock.tick(4000);

          return waitForNextMacroTask();
        })
        .then(() => {
          // We still wait for the first ping to complete,
          sinon.assert.calledOnce(window.fetch);
          assert.isFalse(boxLink.online);

          pingNetworkDefer.resolve({ ok: true });

          return waitForNextMacroTask();
        })
        .then(() => {
          sinon.assert.calledOnce(window.fetch);

          assert.isTrue(boxLink.online);

          // Previous ping request is resolved, so next ping will be performed.
          this.sinon.clock.tick(2000);

          return waitForNextMacroTask();
        })
        .then(() => {
          sinon.assert.calledTwice(window.fetch);
        })
        .then(done, done);
    });

    it('correctly sets "online" status with valid response', function(done) {
      const onOnline = sinon.stub();

      boxLink.on('online', onOnline);
      boxLink.enableAutoPing(2000);

      this.sinon.clock.tick(2000);

      assert.isFalse(boxLink.online);

      waitForNextMacroTask()
        .then(() => {
          assert.isTrue(boxLink.online);

          sinon.assert.calledOnce(onOnline);
          sinon.assert.calledWith(onOnline, true);

          // Now go offline with valid, but non-200 response.
          window.fetch.withArgs('https://box-fake.org/ping').returns(
            Promise.resolve({ ok: false })
          );

          this.sinon.clock.tick(2000);

          return waitForNextMacroTask();
        })
        .then(() => {
          assert.isFalse(boxLink.online);

          sinon.assert.calledTwice(onOnline);
          sinon.assert.calledWith(onOnline, false);
        })
        .then(done, done);
    });

    it('correctly sets "online" status with invalid response', function(done) {
      const onOnline = sinon.stub();

      boxLink.on('online', onOnline);
      boxLink.enableAutoPing(2000);

      this.sinon.clock.tick(2000);

      assert.isFalse(boxLink.online);

      waitForNextMacroTask()
        .then(() => {
          assert.isTrue(boxLink.online);

          sinon.assert.calledOnce(onOnline);
          sinon.assert.calledWith(onOnline, true);

          // Now go offline with invalid response.
          window.fetch.withArgs('https://box-fake.org/ping').returns(
            Promise.reject()
          );

          this.sinon.clock.tick(2000);

          return waitForNextMacroTask();
        })
        .then(() => {
          assert.isFalse(boxLink.online);

          sinon.assert.calledTwice(onOnline);
          sinon.assert.calledWith(onOnline, false);
        })
        .then(done, done);
    });
  });

  /** @test {BoxLink#disableAutoPing} */
  describe('disableAutoPing >', function() {
    let boxLink;

    beforeEach(function() {
      boxLink = new BoxLink('https://box-fake.org');
    });

    it('should not throw if auto ping is not started', function() {
      assert.doesNotThrow(() => boxLink.disableAutoPing());
    });

    it('stops auto ping', function(done) {
      boxLink.enableAutoPing(2000);
      boxLink.disableAutoPing();

      this.sinon.clock.tick(2000);

      assert.isFalse(boxLink.online);

      waitForNextMacroTask()
        .then(() => {
          // If auto ping has been disabled before timer is fired, no request
          // should be made.
          assert.isFalse(boxLink.online);

          boxLink.enableAutoPing(2000);
          this.sinon.clock.tick(2000);
          boxLink.disableAutoPing();

          return waitForNextMacroTask();
        })
        .then(() => {
          assert.isTrue(boxLink.online);

          sinon.assert.calledOnce(window.fetch);

          // Auto ping is disabled so this tick shouldn't cause network request.
          this.sinon.clock.tick(2000);

          return waitForNextMacroTask();
        })
        .then(() => {
          sinon.assert.calledOnce(window.fetch);
        })
        .then(done, done);
    });
  });

  /** @test {BoxLink#seenOnline} */
  describe('seenOnline >', function() {
    let boxLink;

    beforeEach(function() {
      boxLink = new BoxLink('https://box-fake.org');
    });

    it('immediately marks link as "online"', function() {
      assert.isFalse(boxLink.online);

      boxLink.seenOnline();

      assert.isTrue(boxLink.online);
    });

    it('prevents network request if was seen "online" recently',
    function(done) {
      boxLink.enableAutoPing(2000);

      this.sinon.clock.tick(1000);
      boxLink.seenOnline();
      this.sinon.clock.tick(1000);

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.notCalled(window.fetch);
          assert.isTrue(boxLink.online);

          this.sinon.clock.tick(1000);
          boxLink.seenOnline();
          this.sinon.clock.tick(1000);

          return waitForNextMacroTask();
        })
        .then(() => {
          sinon.assert.notCalled(window.fetch);
          assert.isTrue(boxLink.online);

          // Now we don't call "seenOnline" and ping should be performed.
          window.fetch.withArgs('https://box-fake.org/ping').returns(
            Promise.resolve({ ok: false })
          );

          this.sinon.clock.tick(2000);

          return waitForNextMacroTask();
        })
        .then(() => {
          sinon.assert.calledOnce(window.fetch);
          assert.isFalse(boxLink.online);
        })
        .then(done, done);
    });

    it('does not prevent "ping" from forcing network request', function() {
      boxLink.seenOnline();
      boxLink.ping();

      sinon.assert.calledOnce(window.fetch);
      sinon.assert.calledWith(
        window.fetch,
        'https://box-fake.org/ping',
        { cache: 'no-store' }
      );
    });
  });
});
