import ServiceController from 'js/controllers/service';
import Service from 'js/views/service';

describe('Service controller tests', function () {
  let foxboxStub, mountNodeStub, controller;

  before(function() {
    foxboxStub = sinon.stub();
    mountNodeStub = document.createElement('node');

    controller = new ServiceController({
      foxbox: foxboxStub,
      mountNode: mountNodeStub
    });
  });

  it('Controller is successfully created', function() {
    assert.isDefined(controller);
  });

  it('Renders view with correct parameters', function () {
    const createElementStub = sinon.stub();
    const id = 1234;

    sinon.stub(ReactDOM, 'render');
    sinon.stub(React, 'createElement')
      .withArgs(Service, { id: id, foxbox: foxboxStub })
      .returns(createElementStub);

    controller.main(id);

    sinon.assert.calledWith(ReactDOM.render, createElementStub, mountNodeStub);
  });
});
