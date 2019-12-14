'use strict';
//https://stackoverflow.com/questions/32606403/how-to-create-a-shadow-pixi-js

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
var bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;

var app = express();
app.use(express.static(__dirname + '/public'));
console.log(__dirname + '/public');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/game', (req, res) => {
  res.sendFile(__dirname + '/public/game.html');
});

var state = {};
var ballstate = {
    'ball1': { ballId: 'ball1', state: 1, x: 300, y: 300, rotation: 0, tex: 'orange', clientId: null }
};
const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const io = socketIO(server);

io.on('connection', function(socket) {
  console.log('Client connected: ' + socket.id);
  

  socket.on('updateServer', function(clientData) {
    console.log("recv client data");
    if (!state.hasOwnProperty(socket.id)) {
      state[socket.id] = { x: clientData.x, y: clientData.y, rotation: clientData.rotation };
      io.emit('updateClient', state);
    } else {
      state[socket.id].x = clientData.x;
      state[socket.id].y = clientData.y;
      state[socket.id].rotation = clientData.rotation;
      io.emit('updateClient', state);
      if (clientData.track == true) {
        let trackpayload = Object.assign({}, state[socket.id]);
        trackpayload.type = 'createTrack';
        io.emit('handleNonGuaranteed', trackpayload);
      }



      /*if (clientData.hasOwnProperty('balls')) {
        for (var i = 0; i < clientData.balls.length; i++) {
            ballstate[clientData.balls[i]].state = 2;
            ballstate[clientData.balls[i]].x = clientData.x;
            ballstate[clientData.balls[i]].y = clientData.y;
            ballstate[clientData.balls[i]].rotation = clientData.rotation;
        }
        let ballspayload = Object.assign({}, ballstate);
        io.emit('updateClientBalls', ballspayload);
      }*/
    }
  });



  socket.on('pickupBall', function(clientData) {
    ballstate[clientData.ballId].clientId = clientData.clientId;
  });
  socket.emit('updateClientBalls', ballstate);

  socket.on('disconnect', function() {
    delete state[socket.id];
    io.emit('handleDisconnect', { clientId: socket.id });
    console.log('Client disconnected ' + socket.id);
  });
});


/*setInterval(function() {
  console.log("heartbeat...");
  console.log(state);
  console.log("#######################################");
  io.emit('updateClient', state);
}, 33);*/
