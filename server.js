'use strict';
//https://stackoverflow.com/questions/32606403/how-to-create-a-shadow-pixi-js

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
var bodyParser = require('body-parser');
var gamemap = require('./gamemap.js');

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

app.get('/lobby', (req, res) => {
  res.sendFile(__dirname + '/public/lobby.html');
});

var tanks = {};
var balls = {
  'ball1': { ballId: 'ball1', x: 250, y: 250, rotation: 0, color: 'purple', carrier:'idle' },
  'ball2': { ballId: 'ball2', x: 300, y: 300, rotation: 0, color: 'purple', carrier:'idle' }
};

const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const io = socketIO(server);

io.on('connection', function(socket) {
  console.log('Client connected: ' + socket.id);

  tanks[socket.id] = { tankId: socket.id, x: 150, y: 150, rotation: 0, barrelRotation: 0 };

  socket.on('updatePlayer', function(clientData) {
    tanks[socket.id].x = clientData.x;
    tanks[socket.id].y = clientData.y;
    tanks[socket.id].rotation = clientData.rotation;
    tanks[socket.id].barrelRotation = clientData.barrelRotation;

    io.emit('updateTank', clientData);

    // don't think this is even being used anymore?
    if (clientData.hasOwnProperty('shootBallId')) {
      balls[clientData.shootBallId].carrier = "moving";
      io.emit('shootBall', clientData);
    }
  });

  socket.on('getTanks', function() {
    io.emit('newTanks', tanks);
  });

  socket.on('getBalls', function() {
    socket.emit('newBalls', balls);
  });

  socket.on('ballPickup', function(clientData) {
    balls[clientData.ballId].carrier = clientData.tankId;
    io.emit('ballPickedup', clientData);
  });

  socket.on('shootBall', function(clientData) {
    balls[clientData.ballId].carrier = 'moving';
    balls[clientData.ballId].x = clientData.x;
    balls[clientData.ballId].y = clientData.y;
    balls[clientData.ballId].rotation = clientData.barrelRotation;
    balls[clientData.ballId].v = 8;
    io.emit('shootingBall', balls[clientData.ballId]);
  });

  socket.on('ballIdle', function(clientData) {
    balls[clientData.ballId].carrier = 'idle';
    balls[clientData.ballId].x = clientData.x;
    balls[clientData.ballId].y = clientData.y;
    balls[clientData.ballId].rotation = clientData.rotation;
  });

  socket.on('ballBounce', function(clientData) {
    console.log('ball bounce');
    console.log(clientData);
    io.emit('ballBounced', clientData);
  });

  socket.on('disconnect', function() {
    console.log('Client disconnected ' + socket.id);
    delete tanks[socket.id];
    io.emit('removeTank', { tankId: socket.id });
  });
});


/*var gameloop = setInterval(function() {
  for (var ballid in balls) {
    if (balls[ballid].carrier == 'moving') {
      balls[ballid].x = balls[ballid].x + (balls[ballid].v) * Math.cos(balls[ballid].rotation);
      balls[ballid].y = balls[ballid].y + (balls[ballid].v) * Math.sin(balls[ballid].rotation);
      balls[ballid].v -= 0.0625;
      io.emit('ballChanges', balls[ballid]);
    }
  }
}, 50);*/