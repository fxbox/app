'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

var foxbox_resp_path = '../json/foxbox_services.json';

var app = express();

var services_list = express.Router();
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
