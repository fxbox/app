import Defer from 'js/lib/foxbox/defer';

describe('Defer >', function () {
  let defer, onResolve, onReject;

  beforeEach(function () {
    defer = new Defer();

    onResolve = sinon.stub();
    onReject = sinon.stub();

    defer.promise.then(onResolve, onReject);
  });

  it('resolve', function(done) {
    Promise.resolve()
      .then(() => {
        // Underlying promise should not be resolved until we explicitly call
        // 'resolve' method.
        sinon.assert.notCalled(onResolve);
        sinon.assert.notCalled(onReject);

        defer.resolve('value');
      })
      .then(() => {
        sinon.assert.calledOnce(onResolve);
        sinon.assert.calledWith(onResolve, 'value');
        sinon.assert.notCalled(onReject);
      })
      .then(done, done);
  });

  it('reject', function(done) {
    Promise.resolve()
      .then(() => {
        // Underlying promise should not be resolved until we explicitly call
        // 'reject' method.
        sinon.assert.notCalled(onResolve);
        sinon.assert.notCalled(onReject);

        defer.reject('error');
      })
      .then(() => {
        sinon.assert.notCalled(onResolve);
        sinon.assert.calledOnce(onReject);
        sinon.assert.calledWith(onReject, 'error');
      })
      .then(done, done);
  });
});
