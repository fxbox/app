var express = require('express');
var cors = require('cors');
var path = require('path');

var foxboxSimulator = express();
foxboxSimulator.use(cors());

foxboxSimulator.get('/', (req, res) => {
  res.status(200).sendFile(path.join(`${__dirname}/static/login.html`));
});

foxboxSimulator.listen(3000);
