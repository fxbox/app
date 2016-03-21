var express = require('express');
var cors = require('cors');
var path = require('path');
var morgan = require('morgan');

var services_list = require('./services_list');
var service = require('./service_status');

var foxboxSimulator = express();
foxboxSimulator.use(cors());
foxboxSimulator.use(morgan('dev'));

foxboxSimulator.use('/services/list', services_list);
foxboxSimulator.use('/services/:serviceId/state', service);

foxboxSimulator.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname + '/static/login.html'));
});

foxboxSimulator.listen(3000);

module.exports = foxboxSimulator;
