'use strict';
 /* global cordova, cordovaHTTP */

// Expecting URLs of the form:
// https://192-168-0-16.0123456789abcdef0123456789abcdef.plex.direct:12346/
// where the first part is a local IPv4 address and the second part is a 32-char
// alphanumeric string, representing the first 128 bits of the sha256 hash of
// the root certificate with which the local server's TLS certificate is signed,
// in hexadecimal representation.
const FINGERPRINT_PART = 1;

export default class Qr {
  constructor() {
    if (cordova && cordova.plugins &&
        cordova.plugins.barcodeScanner &&
        cordovaHTTP && cordovaHTTP.acceptHss) {
      this.supported = true;
    } else {
      this.supported = false;
    }
  }

  connectTo(url, cb) {
    if (!this.supported) {
      console.warn('QR code based discovery disabled (Cordova plugins not available)');
      return;
    }
    cordovaHTTP.acceptHss(true, function() {
      var urlParts = url.substring('https://'.length).split('.');
      var fingerprint = urlParts[FINGERPRINT_PART];
      cordovaHTTP.get(url, { fingerprint: fingerprint }, { }, cb, cb);
    }, function(e) {
      console.error('Error setting acceptHss', e);
    });
  }

  scanQR(cb) {
    if (!cb) {
      cb = function(result) {
        console.log(result);
      };
    }
    if (!this.supported) {
      console.warn('QR code based discovery disabled (Cordova plugins not available)');
      return;
    }
    cordova.plugins.barcodeScanner.scan(function(result) {
      if (result.cancelled) {
        console.error('Scanning cancelled');
        return;
      }
      this.connectTo(result.text, cb);
    }.bind(this), function (error) {
      console.error('Scanning failed: ' + error);
    });
  }
}
