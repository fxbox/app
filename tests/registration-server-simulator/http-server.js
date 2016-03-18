var express = require('express');
var cors = require('cors');

// Fake registration server:
// To avoid the new implementation of multiboxes
// we will be returning always one box, without tunnel

var registrationServerSimulator = express();
registrationServerSimulator.use(cors());

registrationServerSimulator.get('/ping', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(
    [{"public_ip":"217.111.161.212","local_ip":"127.0.0.1","tunnel_url":"null","timestamp":Math.floor(Date.now()/1000)}]
  );
});

registrationServerSimulator.listen(4455);
