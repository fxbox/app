import API from 'js/lib/foxbox/api';

describe('API >', function () {
  let netStub, settingsStub, api;

  const testBlob = new Blob([], { type: 'image/jpeg' });

  beforeEach(function () {
    settingsStub = sinon.stub({
      session: 'fake_session',
      apiVersion: 5,
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
  });

  describe('when offline or not authenticated >', function() {
    beforeEach(function() {
      netStub.online = false;
      settingsStub.session = '';
    });

    it('"get" correctly waits for the api readiness', function(done) {
      const resourcePromise = api.get('resource');

      // Let all in-progress micro tasks to complete.
      Promise.resolve()
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

      // Let all in-progress micro tasks to complete.
      Promise.resolve()
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

      // Let all in-progress micro tasks to complete.
      Promise.resolve()
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

      // Let all in-progress micro tasks to complete.
      Promise.resolve()
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
  });
});
