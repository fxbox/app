import Foxbox from 'js/lib/foxbox/foxbox';

describe('Foxbox >', function() {
  const singleBox = [{
    public_ip: '1.1.1.1',
    client: 'abc',
    message: JSON.stringify({
      local_origin: 'https://local.abc.box.fake.org:3000',
      tunnel_origin: 'null',
    }),
    timestamp: Math.floor(Date.now() / 1000),
  }];
  const multiBox = singleBox.concat([
    {
      public_ip: '2.2.2.2',
      client: 'def',
      message: JSON.stringify({
        local_origin: 'http://local.def.box.fake.org:3000',
        tunnel_origin: 'null',
      }),
      timestamp: Math.floor(Date.now() / 1000),
    },
  ]);

  let foxbox;
  let netStub;
  let settingsStub;

  beforeEach(function() {
    netStub = sinon.stub({
      init: () => {},
      fetchJSON: () => {},
      on: () => {},
    });

    settingsStub = sinon.stub({
      pollingEnabled: false,
      registrationService: 'https://fake.org:4443/ping',
      on: () => {},
    });

    foxbox = new Foxbox({
      net: netStub,
      settings: settingsStub,
    });
  });

  describe('constructor >', function() {
    it('exposes a non extensible object', function() {
      assert.isObject(foxbox);
      assert.throws(() => foxbox.newProp = true);
    });

    it('throws on bad parameters', function() {
      assert.throws(() => new Foxbox(null));
    });

    it('a net parameter can be provided', function(done) {
      netStub.fetchJSON
        .withArgs('https://fake.org:4443/ping')
        .returns(Promise.resolve());

      foxbox.init()
        .then(() => {
          sinon.assert.calledOnce(netStub.init);
        })
        .then(done, done);
    });
  });

  describe('init >', function() {
    describe('exposes an array of boxes', function() {
      it('in single box mode', function(done) {
        netStub.fetchJSON
          .withArgs('https://fake.org:4443/ping')
          .returns(Promise.resolve(singleBox));

        assert.isArray(foxbox.boxes);

        foxbox.init()
          .then(() => {
            assert.deepEqual(foxbox.boxes, [{
              local_origin: 'https://local.abc.box.fake.org:3000',
              tunnel_origin: 'null',
              client: 'abc',
            }]);
          })
          .then(done, done);
      });

      it('in multiple boxes mode', function(done) {
        netStub.fetchJSON
          .withArgs('https://fake.org:4443/ping')
          .returns(Promise.resolve(multiBox));

        foxbox.init()
          .then(() => {
            assert.equal(foxbox.boxes.length, 2);
          })
          .then(done, done);
      });
    });
  });
});
