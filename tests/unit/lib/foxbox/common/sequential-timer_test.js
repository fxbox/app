import { waitForNextMacroTask } from '../../../test-utils';

import Defer from 'js/lib/foxbox/common/defer';
import SequentialTimer from 'js/lib/foxbox/common/sequential-timer';

/** @test {SequentialTimer} */
describe('SequentialTimer >', function() {
  const DEFAULT_INTERVAL = 2000;

  let timer;
  let onTick;

  beforeEach(function() {
    this.sinon = sinon.sandbox.create();
    this.sinon.useFakeTimers();

    onTick = sinon.stub();
    timer = new SequentialTimer(DEFAULT_INTERVAL);
  });

  afterEach(function() {
    timer.stop();
    this.sinon.restore();
    this.sinon = null;
  });

  /** @test {SequentialTimer#start} */
  describe('start >', function() {
    it('throws if "onTick" is not provided or not a function', function() {
      assert.throws(() => timer.start());
      assert.throws(() => timer.start(null));
      assert.throws(() => timer.start({}));
    });

    it('correctly updates "started" property', function() {
      assert.isFalse(timer.started);

      timer.start(onTick);

      assert.isTrue(timer.started);

      // Should shart, but not call "onTick" immediately.
      sinon.assert.notCalled(onTick);
    });

    it('calls "onTick" only when needed', function(done) {
      timer.start(onTick);
      this.sinon.clock.tick(DEFAULT_INTERVAL - 1);

      // Sequential timer uses promises inside so we should make sure to assert
      // only once all scheduled promises are handled.
      waitForNextMacroTask()
        .then(() => {
          // Should not be called earlier than needed.
          sinon.assert.notCalled(onTick);
          this.sinon.clock.tick(1);

          return waitForNextMacroTask();
        })
        .then(() => {
          sinon.assert.calledOnce(onTick);
          this.sinon.clock.tick(DEFAULT_INTERVAL);

          return waitForNextMacroTask();
        })
        .then(() => sinon.assert.calledTwice(onTick))
        .then(done, done);
    });

    it('tick should wait for the "onTick" resolved promise', function(done) {
      const onTickDefer = new Defer();
      onTick.returns(onTickDefer.promise);

      timer.start(onTick);
      this.sinon.clock.tick(DEFAULT_INTERVAL);

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.calledOnce(onTick);
          this.sinon.clock.tick(DEFAULT_INTERVAL);

          return waitForNextMacroTask();
        })
        .then(() => {
          // onTick should not be called once again until previous promise is
          // resolved.
          sinon.assert.calledOnce(onTick);
          onTickDefer.resolve();

          return waitForNextMacroTask();
        })
        .then(() => {
          // This time next tick should be called.
          this.sinon.clock.tick(DEFAULT_INTERVAL);
          return waitForNextMacroTask();
        })
        .then(() => sinon.assert.calledTwice(onTick))
        .then(done, done);
    });

    it('tick should wait for the "onTick" rejected promise', function(done) {
      const onTickDefer = new Defer();
      onTick.returns(onTickDefer.promise);

      timer.start(onTick);
      this.sinon.clock.tick(DEFAULT_INTERVAL);

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.calledOnce(onTick);
          this.sinon.clock.tick(DEFAULT_INTERVAL);

          return waitForNextMacroTask();
        })
        .then(() => {
          // onTick should not be called once again until previous promise is
          // rejected.
          sinon.assert.calledOnce(onTick);
          onTickDefer.reject();

          return waitForNextMacroTask();
        })
        .then(() => {
          // This time next tick should be called.
          this.sinon.clock.tick(DEFAULT_INTERVAL);
          return waitForNextMacroTask();
        })
        .then(() => sinon.assert.calledTwice(onTick))
        .then(done, done);
    });
  });

  /** @test {SequentialTimer#stop} */
  describe('stop >', function() {
    beforeEach(function() {
      timer.start(onTick);
    });

    it('correctly updates "started" property', function() {
      assert.isTrue(timer.started);

      timer.stop();

      assert.isFalse(timer.started);
    });

    it('prevents first tick if stopped early', function(done) {
      this.sinon.clock.tick(DEFAULT_INTERVAL - 1);

      timer.stop();

      this.sinon.clock.tick(1);

      waitForNextMacroTask()
        .then(() => sinon.assert.notCalled(onTick))
        .then(done, done);
    });

    it('prevents all consequent ticks', function(done) {
      this.sinon.clock.tick(DEFAULT_INTERVAL);

      timer.stop();

      this.sinon.clock.tick(1);

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.calledOnce(onTick);

          timer.stop();
        })
        .then(() => {
          this.sinon.clock.tick(DEFAULT_INTERVAL);
          return waitForNextMacroTask();
        })
        .then(() => sinon.assert.calledOnce(onTick))
        .then(done, done);
    });
  });

  /** @test {SequentialTimer#interval} */
  describe('interval >', function() {
    it('is correctly set by default', function() {
      assert.equal(timer.interval, DEFAULT_INTERVAL);
    });

    it('used for the first tick if updated before timer is started',
    function(done) {
      timer.interval = DEFAULT_INTERVAL - 100;

      timer.start(onTick);

      this.sinon.clock.tick(DEFAULT_INTERVAL - 100);

      waitForNextMacroTask()
        .then(() => sinon.assert.calledOnce(onTick))
        .then(done, done);
    });

    it('used for the next tick if updated when timer is already started',
    function(done) {
      timer.start(onTick);

      timer.interval = DEFAULT_INTERVAL + 100;

      this.sinon.clock.tick(DEFAULT_INTERVAL);

      waitForNextMacroTask()
        .then(() => {
          // Called using interval set before timer started.
          sinon.assert.calledOnce(onTick);

          this.sinon.clock.tick(DEFAULT_INTERVAL);

          return waitForNextMacroTask();
        })
        .then(() => {
          // Should not be called second time since new interval is bigger now.
          sinon.assert.calledOnce(onTick);

          this.sinon.clock.tick(100);

          return waitForNextMacroTask();
        })
        .then(() => sinon.assert.calledTwice(onTick))
        .then(done, done);
    });
  });
});
