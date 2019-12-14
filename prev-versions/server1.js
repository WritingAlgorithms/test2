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
const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const io = socketIO(server);

io.on('connection', function(socket) {
  console.log('Client connected: ' + socket.id);

  socket.on('updateServer', function(client_state) {
    console.log("recv client data");
    if (!state.hasOwnProperty(socket.id)) {
      state[socket.id] = { x: 320, y: 180, rotation: 0 };
    } else {
      state[socket.id].x = client_state.x;
      state[socket.id].y = client_state.y;
      state[socket.id].rotation = client_state.rotation;
    }
  });

  socket.on('disconnect', function() {
    delete state[socket.id];
    console.log('Client disconnected ' + socket.id);
  });
});

setInterval(function() {
  console.log("heartbeat...");
  console.log(state);
  console.log("#######################################");
  io.emit('updateClient', state);
}, 2000);
