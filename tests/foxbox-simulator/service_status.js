'use strict';

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

app.use(morgan('dev'));

var service = express.Router();

var foxbox_resp_path = '../json/...json';

service.use(bodyParser.json());

service.route('/')
.all(function(req,res,next) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      next();
})

.get(function(req,res,next){
	var readable = fs.createReadStream(foxbox_resp_path);
       readable.pipe(res);
})

.put(function(req, res, next){
    //change the state of a light
       
});

app.use('/services/:serviceId/state', service);

module.exports = service;