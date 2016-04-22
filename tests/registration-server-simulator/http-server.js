'use strict';

const express = require('express');
const cors = require('cors');

// Fake registration server:
// To avoid the new implementation of multiboxes
// we will be returning always one box, without tunnel

const singleBox = [{
  public_ip: '1.1.1.1',
  client: 'abc',
  message: JSON.stringify({
    local_origin: 'http://127.0.0.1:3000',
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

registrationServerSimulator.listen(4455);
