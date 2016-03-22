'use strict';

const spawn = require('child_process').spawn;
const chakram = require('chakram'), expect = chakram.expect;

var App = require('../lib/app');
var assert = require('assert');

const Config = require('config-js');
var config = new Config('./tests/config/foxbox.js');
var lightinfo;

describe('Lights tests', function() {
  var app;
  var loginView;
  var servicesView;

  var lightinfo; 
  var lightId;
  var lightOnOff;
  this.timeout(30000);

  before(() => {
    app = new App();
    return app.init()
      .then(defaultView => { loginView = defaultView; });
  });

  it('get the list of Lights', () => {
    return loginView.loginSuccess(12345678)
    .then(function() {
      return chakram.get(config.get('foxbox.url') + '/services/list')
        .then(function(listResponse) {
          expect(listResponse).to.have.status(200);
          lightinfo = listResponse.body;
          lightId = lightinfo.id;
          console.log(lightId);
          console.log(lightinfo);
          return;
    	});
      });
  });

  it('should turn a light on', () => {
      return chakram.put(config.get('foxbox.url') + '/services/' + lightId + '/state', {'on': true})
        .then(function(statusResponse) {
         expect(statusResponse).to.have.status(200);
         console.log(statusResponse.body.response);
         return expect(statusResponse.body.response).equals('success');
      });
  });

  after(() => {
    return app.stop();
  });
});
