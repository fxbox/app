import React from 'components/react';
import ReactDOM from 'components/react-dom';
import ServiceController from 'js/controllers/service';
import Service from 'js/views/service';

describe('Service controller tests', function () {
  let foxboxStub, mountNodeStub, controller;

  beforeEach(function () {
    this.sinon = sinon.sandbox.create();

    foxboxStub = sinon.stub();
    mountNodeStub = document.createElement('node');

    controller = new ServiceController({
      foxbox: foxboxStub,
      mountNode: mountNodeStub,
    });
  });

  afterEach(function() {
    this.sinon.restore();
    this.sinon = null;
  });

  it('Controller is successfully created', function() {
    assert.isDefined(controller);
  });

  it('Renders view with correct parameters', function () {
    const createElementStub = sinon.stub();
    const id = 1234;

    this.sinon.stub(ReactDOM, 'render');
    this.sinon.stub(React, 'createElement')
      .withArgs(Service, { id, foxbox: foxboxStub })
      .returns(createElementStub);

    controller.main(id);

    sinon.assert.calledWith(ReactDOM.render, createElementStub, mountNodeStub);
  });
});
