'use strict';
 /* global cordova, cordovaHTTP */

// Expecting URLs of the form:
// https://d52f9607a464a51bc4bdb43df4628f63.self-signed:4333/
// where the first part is a 32-char
// alphanumeric string, representing the first 128 bits of the sha256 hash of
// the root certificate with which the local server's TLS certificate is signed,
// in hexadecimal representation.
const FINGERPRINT_PART = 0;

export default class Qr {
  constructor() {
    if (cordova && cordova.plugins &&
        cordova.plugins.zeroconf &&
        cordovaHTTP && cordovaHTTP.acceptHss) {
      this.supported = true;
    } else {
      this.supported = false;
    }
    this.hosts = {};
  }

  connectTo(url, cb) {
    if (!this.supported) {
      console.warn('QR code based discovery disabled (Cordova plugins not available)');
      return;
    }
    cordovaHTTP.acceptHss(true, function() {
      var urlParts = url.substring('https://'.length).split('.');
      var fingerprint = urlParts[FINGERPRINT_PART];
      console.log('Trying', this.hosts[url], fingerprint);
      cordovaHTTP.get(this.hosts[url], { fingerprint: fingerprint }, { }, cb, cb);
    }.bind(this), function(e) {
      console.error('Error setting acceptHss', e);
    });
  }

  discover() {
    cordova.plugins.zeroconf.watch('_https._tcp.local.', function(result) {
      console.log('zeroconf msg', result);
      var service = result.service;
      if (result.action == 'added' && result.service.txtRecord.name) {
        if (service.addresses[0].indexOf('.') !== -1) {
          this.hosts[`https://${result.service.txtRecord.name}:${result.service.port}/`] =
              `https://${result.service.addresses[0]}:${result.service.port}/`;
        } else {
          this.hosts[`https://${result.service.txtRecord.name}:${result.service.port}/`] =
              `https://${result.service.addresses[1]}:${result.service.port}/`;
        }
        console.log('this.hosts now', this.hosts);
      }
    }.bind(this));
  }
}
