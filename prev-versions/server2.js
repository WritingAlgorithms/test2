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
    'ball1': { ballId: 'ball1', state: 1, parentId: '', idleX: 300, idleY: 300, idleRot: 0, tex: 'purple' },
    'ball2': { ballId: 'ball2', state: 1, parentId: '', idleX: 600, idleY: 300, idleRot: 0, tex: 'orange' },
    'ball3': { ballId: 'ball3', state: 1, parentId: '', idleX: 800, idleY: 300, idleRot: 0, tex: 'red'  }
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
    }
  });


  socket.on('getBalls', function() {
    socket.emit('setBalls', ballstate);
  });


  socket.on('updateBallState', function(clientData) {
    ballstate[clientData.ballId].parentId = clientData.parentId;
    ballstate[clientData.ballId].state = clientData.state;

    io.emit('ballStateChange', clientData);
  });

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
