'use strict';

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Fake registration server:
// To avoid the new implementation of multiboxes
// we will be returning always one box, without tunnel

const singleBox = [{
  public_ip: '1.1.1.1',
  client: 'abc',
  message: JSON.stringify({
    local_origin: 'https://127.0.0.1:3000',
    tunnel_origin: 'null',
  }),
  timestamp: Math.floor(Date.now() / 1000),
}];

const registrationServerSimulator = express();
registrationServerSimulator.use(cors());

registrationServerSimulator.get('/ping', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(singleBox);
});

https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, '../../certs/private/localhost.key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../certs/certs/localhost.cert.pem')),
    passphrase: 'Foxlink',
  },
  registrationServerSimulator
).listen(4455);
