var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();

var service = express.Router();

var state = '../json/state.json';
var light_status;

service.use(bodyParser.json());

function turnOnLight(on) {
	console.log('On');
	light_status = true;
}

function turnOffLight(on) {
	console.log('Off');
	light_status = false;
}

service.route('/')
.all(function(req,res,next) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      next();
})

.get(function(req,res,next){
	var readable = fs.createReadStream(state);
       readable.pipe(res);

})
.put(function(req, res, next){
   if (req.body.on) {
          console.log(req.body.on + ' ' + 'so turn off');
          turnOffLight(req.params.on);
        }
        else {
          console.log(req.body.on + ' ' + 'so turn on');  
          turnOnLight(req.params.on);    
    }
});

app.use('/services/:serviceId/state', service);

module.exports = service;