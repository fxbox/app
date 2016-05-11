import { waitForNextMacroTask } from '../../test-utils';
import API from 'js/lib/foxbox/api';

describe('API >', function () {
  let netStub, settingsStub, api;

  const testBlob = new Blob([], { type: 'image/jpeg' });

  beforeEach(function () {
    this.sinon = sinon.sandbox.create();
    this.sinon.useFakeTimers();

    settingsStub = sinon.stub({
      session: 'fake_session',
      apiVersion: 5,
      watchInterval: 1000,
      once: () => {},
    });

    netStub = sinon.stub({
      origin: 'https://secure-box.com',
      online: true,
      fetchJSON: () => {},
      fetchBlob: () => {},
      once: () => {},
    });
    netStub.fetchJSON.returns(Promise.resolve({ property: 'property' }));
    netStub.fetchBlob.returns(Promise.resolve(testBlob));

    api = new API(netStub, settingsStub);
  });

  afterEach(function() {
    this.sinon.restore();
    this.sinon = null;
  });

  describe('when online and authenticated >', function() {
    describe('get >', function() {
      it('throws if wrong path is used', function(done) {
        const noArgsPromise = api.get()
          .then(
            () => { throw new Error('get should not be resolved!'); },
            (error) => error
          );

        const emptyStringPromise = api.get('')
          .then(
            () => { throw new Error('get should not be resolved!'); },
            (error) => error
          );

        const nullArgsPromise = api.get(null)
          .then(
            () => { throw new Error('get should not be resolved!'); },
            (error) => error
          );

        Promise.all([noArgsPromise, emptyStringPromise, nullArgsPromise])
          .then(([noArgsError, emptyStringError, nullArgsError]) => {
            assert.instanceOf(noArgsError, Error);
            assert.instanceOf(emptyStringError, Error);
            assert.instanceOf(nullArgsError, Error);
          })
          .then(done, done);
      });

      it('uses correct URL and parameters to fetch resource', function(done) {
        api.get('resource')
          .then((data) => {
            sinon.assert.calledOnce(netStub.fetchJSON);
            sinon.assert.calledWithExactly(
              netStub.fetchJSON,
              'https://secure-box.com/api/v5/resource'
            );

            assert.deepEqual(data, { property: 'property' });
          })
          .then(done, done);
      });
    });

    describe('post >', function() {
      it('throws if wrong path is used', function(done) {
        const noArgsPromise = api.post()
          .then(
            () => { throw new Error('post should not be resolved!'); },
            (error) => error
          );

        const emptyStringPromise = api.post('')
          .then(
            () => { throw new Error('post should not be resolved!'); },
            (error) => error
          );

        const nullArgsPromise = api.post(null)
          .then(
            () => { throw new Error('post should not be resolved!'); },
            (error) => error
          );

        Promise.all([noArgsPromise, emptyStringPromise, nullArgsPromise])
          .then(([noArgsError, emptyStringError, nullArgsError]) => {
            assert.instanceOf(noArgsError, Error);
            assert.instanceOf(emptyStringError, Error);
            assert.instanceOf(nullArgsError, Error);
          })
          .then(done, done);
      });

      it('uses correct URL and parameters to fetch resource', function(done) {
        api.post('resource-post', { parameters: 'parameters' })
          .then((data) => {
            sinon.assert.calledOnce(netStub.fetchJSON);
            sinon.assert.calledWithExactly(
              netStub.fetchJSON,
              'https://secure-box.com/api/v5/resource-post',
              'POST',
              { parameters: 'parameters' }
            );

            assert.deepEqual(data, { property: 'property' });
          })
          .then(done, done);
      });
    });

    describe('put >', function() {
      it('throws if wrong path is used', function(done) {
        const noArgsPromise = api.put()
          .then(
            () => { throw new Error('post should not be resolved!'); },
            (error) => error
          );

        const emptyStringPromise = api.put('')
          .then(
            () => { throw new Error('post should not be resolved!'); },
            (error) => error
          );

        const nullArgsPromise = api.put(null)
          .then(
            () => { throw new Error('post should not be resolved!'); },
            (error) => error
          );

        Promise.all([noArgsPromise, emptyStringPromise, nullArgsPromise])
          .then(([noArgsError, emptyStringError, nullArgsError]) => {
            assert.instanceOf(noArgsError, Error);
            assert.instanceOf(emptyStringError, Error);
            assert.instanceOf(nullArgsError, Error);
          })
          .then(done, done);
      });

      it('uses correct URL and parameters to fetch resource', function(done) {
        api.put('resource-put', { parameters: 'parameters' })
          .then((data) => {
            sinon.assert.calledOnce(netStub.fetchJSON);
            sinon.assert.calledWithExactly(
              netStub.fetchJSON,
              'https://secure-box.com/api/v5/resource-put',
              'PUT',
              { parameters: 'parameters' }
            );

            assert.deepEqual(data, { property: 'property' });
          })
          .then(done, done);
      });
    });

    describe('blob >', function() {
      it('throws if wrong path is used', function(done) {
        const noArgsPromise = api.blob()
          .then(
            () => { throw new Error('post should not be resolved!'); },
            (error) => error
          );

        const emptyStringPromise = api.blob('')
          .then(
            () => { throw new Error('post should not be resolved!'); },
            (error) => error
          );

        const nullArgsPromise = api.blob(null)
          .then(
            () => { throw new Error('post should not be resolved!'); },
            (error) => error
          );

        Promise.all([noArgsPromise, emptyStringPromise, nullArgsPromise])
          .then(([noArgsError, emptyStringError, nullArgsError]) => {
            assert.instanceOf(noArgsError, Error);
            assert.instanceOf(emptyStringError, Error);
            assert.instanceOf(nullArgsError, Error);
          })
          .then(done, done);
      });

      it('uses "GET" and "image/jpeg" by default', function(done) {
        api.blob('resource-blob-get')
          .then((blob) => {
            sinon.assert.calledOnce(netStub.fetchBlob);
            sinon.assert.calledWithExactly(
              netStub.fetchBlob,
              'https://secure-box.com/api/v5/resource-blob-get',
              'image/jpeg'
            );

            assert.strictEqual(blob, testBlob);
          })
          .then(done, done);
      });

      it('uses correct URL and parameters to fetch blob', function(done) {
        api.blob(
          'resource-blob-put',
          { parameters: 'parameters' },
          'blob/x-blob'
        )
        .then((blob) => {
          sinon.assert.calledOnce(netStub.fetchBlob);
          sinon.assert.calledWithExactly(
            netStub.fetchBlob,
            'https://secure-box.com/api/v5/resource-blob-put',
            'blob/x-blob',
            'PUT',
            { parameters: 'parameters' }
          );

          assert.strictEqual(blob, testBlob);
        })
        .then(done, done);
      });
    });

    describe('watch >', function() {
      const testGetterId1 = 'getter-id-1';
      const testGetterId2 = 'getter-id-2';

      const testGetter1Values = {
        oldValue: { OpenClosed: 'Open' },
        newValue: { OpenClosed: 'Closed' },
      };

      const testGetter2Values = {
        oldValue: { DoorLocked: 'Locked' },
        newValue: { DoorLocked: 'Unlocked' },
      };

      let onWatch1Stub;
      let onWatch2Stub;

      beforeEach(function() {
        onWatch1Stub = sinon.stub();
        onWatch2Stub = sinon.stub();

        netStub.fetchJSON.withArgs(
          'https://secure-box.com/api/v5/channels/get',
          'PUT',
          [{ id: testGetterId1 }]
        ).returns(
          Promise.resolve({ [testGetterId1]: testGetter1Values.oldValue })
        );

        netStub.fetchJSON.withArgs(
          'https://secure-box.com/api/v5/channels/get',
          'PUT',
          [{ id: testGetterId1 }, { id: testGetterId2 }]
        ).returns(
          Promise.resolve({
            [testGetterId1]: testGetter1Values.oldValue,
            [testGetterId2]: testGetter2Values.oldValue,
          })
        );
      });

      it('starts watching only if at least one watcher is set', function(done) {
        this.sinon.clock.tick(settingsStub.watchInterval);

        waitForNextMacroTask()
          .then(() => {
            sinon.assert.notCalled(netStub.fetchJSON);

            api.watch(testGetterId1, onWatch1Stub);

            this.sinon.clock.tick(settingsStub.watchInterval);

            return waitForNextMacroTask();
          })
          .then(() => {
            sinon.assert.calledOnce(netStub.fetchJSON);
            sinon.assert.calledWith(onWatch1Stub, testGetter1Values.oldValue);
          })
          .then(done, done);
      });

      it('fires handler only if value changed', function(done) {
        api.watch(testGetterId1, onWatch1Stub);

        this.sinon.clock.tick(settingsStub.watchInterval);

        waitForNextMacroTask()
          .then(() => {
            // Called once first value is retrieved, since by default we have
            // null;
            sinon.assert.calledOnce(netStub.fetchJSON);
            sinon.assert.calledOnce(onWatch1Stub);
            sinon.assert.calledWith(onWatch1Stub, testGetter1Values.oldValue);

            this.sinon.clock.tick(settingsStub.watchInterval);
            return waitForNextMacroTask();
          })
          .then(() => {
            // Value hasn't changed so handler function should not be called.
            sinon.assert.calledTwice(netStub.fetchJSON);
            sinon.assert.calledOnce(onWatch1Stub);

            // Now let's simulate changed value
            netStub.fetchJSON.withArgs(
              'https://secure-box.com/api/v5/channels/get',
              'PUT',
              [{ id: testGetterId1 }]
            ).returns(
              Promise.resolve({ [testGetterId1]: testGetter1Values.newValue })
            );

            this.sinon.clock.tick(settingsStub.watchInterval);
            return waitForNextMacroTask();
          })
          .then(() => {
            sinon.assert.calledThrice(netStub.fetchJSON);
            sinon.assert.calledTwice(onWatch1Stub);
            sinon.assert.calledWith(onWatch1Stub, testGetter1Values.newValue);
          })
          .then(done, done);
      });

      it('groups all watcher request into one network request', function(done) {
        api.watch(testGetterId1, onWatch1Stub);
        api.watch(testGetterId2, onWatch2Stub);

        this.sinon.clock.tick(settingsStub.watchInterval);

        waitForNextMacroTask()
          .then(() => {
            // Called once first value is retrieved, since by default we have
            // null;
            sinon.assert.calledOnce(netStub.fetchJSON);

            sinon.assert.calledOnce(onWatch1Stub);
            sinon.assert.calledWith(onWatch1Stub, testGetter1Values.oldValue);

            sinon.assert.calledOnce(onWatch2Stub);
            sinon.assert.calledWith(onWatch2Stub, testGetter2Values.oldValue);

            this.sinon.clock.tick(settingsStub.watchInterval);
            return waitForNextMacroTask();
          })
          .then(() => {
            // Value hasn't changed so handler function should not be called.
            sinon.assert.calledTwice(netStub.fetchJSON);

            sinon.assert.calledOnce(onWatch1Stub);
            sinon.assert.calledOnce(onWatch2Stub);

            // Now let's simulate changed value for second getter only.
            netStub.fetchJSON.withArgs(
              'https://secure-box.com/api/v5/channels/get',
              'PUT',
              [{ id: testGetterId1 }, { id: testGetterId2 }]
            ).returns(
              Promise.resolve({
                [testGetterId1]: testGetter1Values.oldValue,
                [testGetterId2]: testGetter2Values.newValue,
              })
            );

            this.sinon.clock.tick(settingsStub.watchInterval);
            return waitForNextMacroTask();
          })
          .then(() => {
            sinon.assert.calledThrice(netStub.fetchJSON);

            // Getter 1 value hasn't changed.
            sinon.assert.calledOnce(onWatch1Stub);

            sinon.assert.calledTwice(onWatch2Stub);
            sinon.assert.calledWith(onWatch2Stub, testGetter2Values.newValue);
          })
          .then(done, done);
      });
    });

    describe('unwatch >', function() {
      const testGetterId1 = 'getter-id-1';
      const testGetterId2 = 'getter-id-2';

      const getter1Value = { OpenClosed: 'Open' };
      const getter2Value = { DoorLocked: 'Locked' };

      let onWatch1Stub;
      let onWatch2Stub;

      beforeEach(function() {
        onWatch1Stub = sinon.stub();
        onWatch2Stub = sinon.stub();

        netStub.fetchJSON.withArgs(
          'https://secure-box.com/api/v5/channels/get',
          'PUT',
          [{ id: testGetterId1 }]
        ).returns(
          Promise.resolve({ [testGetterId1]: getter1Value })
        );

        netStub.fetchJSON.withArgs(
          'https://secure-box.com/api/v5/channels/get',
          'PUT',
          [{ id: testGetterId1 }, { id: testGetterId2 }]
        ).returns(
          Promise.resolve({
            [testGetterId1]: getter1Value,
            [testGetterId2]: getter2Value,
          })
        );
      });

      it('correctly removes unregistered watchers', function(done) {
        api.watch(testGetterId1, onWatch1Stub);
        api.watch(testGetterId2, onWatch2Stub);

        this.sinon.clock.tick(settingsStub.watchInterval);

        waitForNextMacroTask()
          .then(() => {
            // Called once first value is retrieved, since by default we have
            // null;
            sinon.assert.calledOnce(netStub.fetchJSON);
            sinon.assert.calledWith(
              netStub.fetchJSON,
              'https://secure-box.com/api/v5/channels/get',
              'PUT',
              [{ id: testGetterId1 }, { id: testGetterId2 }]
            );

            sinon.assert.calledOnce(onWatch1Stub);
            sinon.assert.calledWith(onWatch1Stub, getter1Value);

            sinon.assert.calledOnce(onWatch2Stub);
            sinon.assert.calledWith(onWatch2Stub, getter2Value);

            // Let's unwatch second getter.
            api.unwatch(testGetterId2, onWatch2Stub);

            this.sinon.clock.tick(settingsStub.watchInterval);
            return waitForNextMacroTask();
          })
          .then(() => {
            // Value hasn't changed so handler function should not be called.
            sinon.assert.calledTwice(netStub.fetchJSON);
            sinon.assert.calledWith(
              netStub.fetchJSON,
              'https://secure-box.com/api/v5/channels/get',
              'PUT',
              [{ id: testGetterId1 }]
            );

            sinon.assert.calledOnce(onWatch1Stub);
            sinon.assert.calledOnce(onWatch2Stub);

            // Let's unwatch first getter and now watching should stop
            // completely.

            api.unwatch(testGetterId1, onWatch1Stub);

            this.sinon.clock.tick(settingsStub.watchInterval);
            return waitForNextMacroTask();
          })
          .then(() => {
            // Nothing should be called once again.
            sinon.assert.calledTwice(netStub.fetchJSON);
            sinon.assert.calledOnce(onWatch1Stub);
            sinon.assert.calledOnce(onWatch2Stub);
          })
          .then(done, done);
      });
    });
  });

  describe('when offline or not authenticated >', function() {
    beforeEach(function() {
      netStub.online = false;
      settingsStub.session = '';
    });

    it('"get" correctly waits for the api readiness', function(done) {
      const resourcePromise = api.get('resource');

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.notCalled(netStub.fetchJSON);

          netStub.online = true;
          netStub.once.withArgs('online').yield();
        })
        .then(() => {
          // We're online, but still don't have authenticated session.
          sinon.assert.notCalled(netStub.fetchJSON);

          settingsStub.session = 'session';
          settingsStub.once.withArgs('session').yield();

          return resourcePromise;
        })
        .then((data) => {
          sinon.assert.calledOnce(netStub.fetchJSON);
          sinon.assert.calledWithExactly(
            netStub.fetchJSON,
            'https://secure-box.com/api/v5/resource'
          );

          assert.deepEqual(data, { property: 'property' });
        })
        .then(done, done);
    });

    it('"post" correctly waits for the api readiness', function(done) {
      const resourcePromise = api.post(
        'resource-post', { parameters: 'parameters' }
      );

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.notCalled(netStub.fetchJSON);

          netStub.online = true;
          netStub.once.withArgs('online').yield();
        })
        .then(() => {
          // We're online, but still don't have authenticated session.
          sinon.assert.notCalled(netStub.fetchJSON);

          settingsStub.session = 'session';
          settingsStub.once.withArgs('session').yield();

          return resourcePromise;
        })
        .then((data) => {
          sinon.assert.calledOnce(netStub.fetchJSON);
          sinon.assert.calledWithExactly(
            netStub.fetchJSON,
            'https://secure-box.com/api/v5/resource-post',
            'POST',
            { parameters: 'parameters' }
          );

          assert.deepEqual(data, { property: 'property' });
        })
        .then(done, done);
    });

    it('"put" correctly waits for the api readiness', function(done) {
      const resourcePromise = api.put(
        'resource-put', { parameters: 'parameters' }
      );

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.notCalled(netStub.fetchJSON);

          netStub.online = true;
          netStub.once.withArgs('online').yield();
        })
        .then(() => {
          // We're online, but still don't have authenticated session.
          sinon.assert.notCalled(netStub.fetchJSON);

          settingsStub.session = 'session';
          settingsStub.once.withArgs('session').yield();

          return resourcePromise;
        })
        .then((data) => {
          sinon.assert.calledOnce(netStub.fetchJSON);
          sinon.assert.calledWithExactly(
            netStub.fetchJSON,
            'https://secure-box.com/api/v5/resource-put',
            'PUT',
            { parameters: 'parameters' }
          );

          assert.deepEqual(data, { property: 'property' });
        })
        .then(done, done);
    });

    it('"blob" correctly waits for the api readiness', function(done) {
      const resourcePromise = api.blob(
        'resource-blob-put',
        { parameters: 'parameters' },
        'blob/x-blob'
      );

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.notCalled(netStub.fetchBlob);

          netStub.online = true;
          netStub.once.withArgs('online').yield();
        })
        .then(() => {
          // We're online, but still don't have authenticated session.
          sinon.assert.notCalled(netStub.fetchBlob);

          settingsStub.session = 'session';
          settingsStub.once.withArgs('session').yield();

          return resourcePromise;
        })
        .then((blob) => {
          sinon.assert.calledOnce(netStub.fetchBlob);
          sinon.assert.calledWithExactly(
            netStub.fetchBlob,
            'https://secure-box.com/api/v5/resource-blob-put',
            'blob/x-blob',
            'PUT',
            { parameters: 'parameters' }
          );

          assert.strictEqual(blob, testBlob);
        })
        .then(done, done);
    });

    it('"watch" correctly waits for the api readiness', function(done) {
      const getterToWatchId = 'getter-id-1';
      const onWatchStub = sinon.stub();

      netStub.fetchJSON.withArgs(
        'https://secure-box.com/api/v5/channels/get',
        'PUT',
        [{ id: getterToWatchId }]
      ).returns(
        Promise.resolve({ [getterToWatchId]: { OpenClosed: 'Open' } })
      );

      api.watch(getterToWatchId, onWatchStub);

      this.sinon.clock.tick(settingsStub.watchInterval);

      waitForNextMacroTask()
        .then(() => {
          sinon.assert.notCalled(netStub.fetchJSON);
          sinon.assert.notCalled(onWatchStub);

          netStub.online = true;
          netStub.once.withArgs('online').yield();
        })
        .then(() => {
          // We're online, but still don't have authenticated session.
          sinon.assert.notCalled(netStub.fetchJSON);
          sinon.assert.notCalled(onWatchStub);

          settingsStub.session = 'session';
          settingsStub.once.withArgs('session').yield();

          return waitForNextMacroTask();
        })
        .then(() => {
          sinon.assert.calledOnce(netStub.fetchJSON);
          sinon.assert.calledWithExactly(
            netStub.fetchJSON,
            'https://secure-box.com/api/v5/channels/get',
            'PUT',
            [{ id: getterToWatchId }]
          );

          sinon.assert.calledOnce(onWatchStub);
          sinon.assert.calledWithExactly(onWatchStub, { OpenClosed: 'Open' });
        })
        .then(done, done);
    });
  });
});
