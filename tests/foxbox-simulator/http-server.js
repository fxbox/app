'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');

const foxboxSimulator = express();
foxboxSimulator.use(cors());

foxboxSimulator.get('/', (req, res) => {
  res.status(200).sendFile(path.join(`${__dirname}/static/login.html`));
});

foxboxSimulator.get('/ping', (req, res) => {
  res.status(204).end();
});

https.createServer(
  {
    key: fs.readFileSync(path.join(__dirname, '../../certs/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../certs/cert.pem')),
  },
  foxboxSimulator
).listen(3000);
