'use strict';

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

app.use(morgan('dev'));

var services_list = express.Router();

var foxbox_resp_path = '../json/foxbox_services.json';

services_list.use(bodyParser.json());

services.route('/')
.all(function(req,res,next) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      next();
})

.get(function(req,res,next){
       var readable = fs.createReadStream(foxbox_resp_path);
       readable.pipe(res);

});

app.use('/services/', services_list);

module.exports = services_list;