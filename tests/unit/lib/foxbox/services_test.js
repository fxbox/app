import { waitFor } from '../../test-utils';

import Services from 'js/lib/foxbox/services';
import BaseService from 'js/lib/foxbox/services/base';
import DoorLockService from 'js/lib/foxbox/services/door-lock';
import MotionSensorService from 'js/lib/foxbox/services/motion-sensor';

describe('Services >', function () {
  let services, dbStub, apiStub, settingsStub;

  const dbServices = [
    {
      id: 'id-one',
      adapter: 'x-unknown-service',
      properties: {},
      getters: {},
      setters: {},
    },
    {
      id: 'id-two',
      adapter: 'OpenZwave Adapter',
      properties: {
        manufacturer: 'zwave-manufacturer',
        model: 'zwave-model',
        name: 'zwave-name',
      },
      getters: {
        motionGetterId: {
          id: 'motionGetterId',
          kind: 'OpenClosed',
        },
      },
      setters: {},
    },
  ];

  beforeEach(function () {
    dbStub = sinon.stub({
      getServices: () => {},
      setService: () => {},
      deleteService: () => {},
    });
    dbStub.getServices.returns(Promise.resolve(dbServices));

    apiStub = sinon.stub({ get: () => {} });

    settingsStub = sinon.stub({ pollingInterval: 2000 });

    services = new Services(dbStub, apiStub, settingsStub);
  });

  it('"getAll" returns all currently cached services', function(done) {
    services.getAll()
      .then((services) => {
        assert.lengthOf(services, 2);

        const [baseService, motionSensorService] = services;

        assert.instanceOf(baseService, BaseService);
        assert.instanceOf(motionSensorService, MotionSensorService);

        assert.equal(baseService.id, 'id-one');
        assert.equal(baseService.manufacturer, '');
        assert.equal(baseService.model, '');
        assert.equal(baseService.name, '');

        assert.equal(motionSensorService.id, 'id-two');
        assert.equal(motionSensorService.manufacturer, 'zwave-manufacturer');
        assert.equal(motionSensorService.model, 'zwave-model');
        assert.equal(motionSensorService.name, 'zwave-name');
      })
      .then(done, done);
  });

  it('"get" returns service by its id', function(done) {
    Promise.all([services.get('id-one'), services.get('id-two')])
      .then(([baseService, motionSensorService]) => {
        assert.instanceOf(baseService, BaseService);
        assert.instanceOf(motionSensorService, MotionSensorService);

        assert.equal(baseService.id, 'id-one');
        assert.equal(baseService.manufacturer, '');
        assert.equal(baseService.model, '');
        assert.equal(baseService.name, '');

        assert.equal(motionSensorService.id, 'id-two');
        assert.equal(motionSensorService.manufacturer, 'zwave-manufacturer');
        assert.equal(motionSensorService.model, 'zwave-model');
        assert.equal(motionSensorService.name, 'zwave-name');
      })
      .then(done, done);
  });

  describe('polling >', function() {
    const doorLockServiceRaw = {
      id: 'id-three',
      adapter: 'OpenZwave Adapter',
      properties: {},
      getters: {
        doorLockGetterId: {
          id: 'doorLockGetterId',
          kind: 'DoorLocked',
        },
      },
      setters: {},
    };

    let onServicesChangedStub;

    beforeEach(function() {
      this.sinon = sinon.sandbox.create();
      this.sinon.useFakeTimers();

      onServicesChangedStub = sinon.stub();
      services.once('services-changed', onServicesChangedStub);

      services.togglePolling(true);
    });

    it('new service should be added to the list', function(done) {
      apiStub.get.withArgs('services').returns(
        Promise.resolve([...dbServices, doorLockServiceRaw])
      );

      // Tick 2000 and immediately restore clock so that 'waitFor' can use real
      // setTimeout and setInterval.
      this.sinon.clock.tick(2000);
      this.sinon.clock.restore();

      // Wait until services cache is updated.
      waitFor(() => onServicesChangedStub.called)
        .then(() => services.getAll())
        .then((services) => {
          assert.lengthOf(services, 3);

          const [baseService, motionSensorService, doorLockService] = services;

          assert.instanceOf(baseService, BaseService);
          assert.instanceOf(motionSensorService, MotionSensorService);
          assert.instanceOf(doorLockService, DoorLockService);

          assert.equal(baseService.id, 'id-one');
          assert.equal(baseService.manufacturer, '');
          assert.equal(baseService.model, '');
          assert.equal(baseService.name, '');

          assert.equal(motionSensorService.id, 'id-two');
          assert.equal(motionSensorService.manufacturer, 'zwave-manufacturer');
          assert.equal(motionSensorService.model, 'zwave-model');
          assert.equal(motionSensorService.name, 'zwave-name');

          assert.equal(doorLockService.id, 'id-three');
          assert.equal(doorLockService.manufacturer, '');
          assert.equal(doorLockService.model, '');
          assert.equal(doorLockService.name, '');
        })
        .then(done, done);
    });

    it('old service should be remove from the list', function(done) {
      apiStub.get.withArgs('services').returns(
        Promise.resolve([dbServices[0]])
      );

      // Tick 2000 and immediately restore clock so that 'waitFor' can use real
      // setTimeout and setInterval.
      this.sinon.clock.tick(2000);
      this.sinon.clock.restore();

      // Wait until services cache is updated.
      waitFor(() => onServicesChangedStub.called)
        .then(() => services.getAll())
        .then((services) => {
          assert.lengthOf(services, 1);

          const [baseService] = services;

          assert.instanceOf(baseService, BaseService);

          assert.equal(baseService.id, 'id-one');
          assert.equal(baseService.manufacturer, '');
          assert.equal(baseService.model, '');
          assert.equal(baseService.name, '');
        })
        .then(done, done);
    });
  });
});
