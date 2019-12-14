var left = keyboard("ArrowLeft"); left.press = () => {};
var right = keyboard("ArrowRight"); right.press = () => {};
var up = keyboard("ArrowUp"); up.press = () => {};
var space = keyboard(" "); space.press = () => {};
const BALL_STATE = {
    IDLE: 1,
    MOVING: 2,
    HELD: 3
};

var socket;
var app = new PIXI.Application({ 
    width: 256,         // default: 800
    height: 256,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
  }
);

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight-100);
document.body.appendChild(app.view);

var bump = new Bump(app.renderer);

var gameScene = new PIXI.Container(); 
gameScene.sortableChildren = true;
var tankContainer = new PIXI.Container();
var playerContainer = new PIXI.Container();
var ballContainer = new PIXI.Container();
ballContainer.sortableChildren = true;
var tilingSprite, player, tracks = [], tanks = {}, balls = {};

/* ball textures */
var tex_ballPurple, tex_ballOrange, tex_ballRed;
var gr = new PIXI.Graphics();
gr.beginFill(0x9966FF);
gr.drawCircle(app.screen.width / 3, app.screen.height / 3, 6);
gr.endFill();
tex_ballPurple = app.renderer.generateTexture(gr);
gr.clear();

gr.beginFill(0xFFA500);
gr.drawCircle(app.screen.width - 200, app.screen.height - 200, 6);
gr.endFill();
tex_ballOrange = app.renderer.generateTexture(gr);
gr.clear();

gr.beginFill(0xFF0000);
gr.drawCircle(app.screen.width - 500, app.screen.height - 500, 6);
gr.endFill();
tex_ballRed = app.renderer.generateTexture(gr);
gr.clear();
/***************/

var socket = io();
socket.on('connect', function() {
    PIXI.loader.add([
        "./assets/sprites/tileSand1.png",
        "./assets/sprites/tileSand2.png",
        "./assets/sprites/tank_green.png",
        "./assets/sprites/tank_blue.png",
        "./assets/sprites/tracksSmall.png",
        "./assets/sprites/shotThin.png"
    ]).load(setup);
});

function setup() {

    tilingSprite = new PIXI.TilingSprite(
        PIXI.loader.resources["./assets/sprites/tileSand1.png"].texture,
        app.renderer.width,
        app.renderer.height
    );

    gameScene.addChild(tilingSprite);

    player = new Player(socket, app.screen.width/2,app.screen.height/2,4,PIXI.loader.resources["./assets/sprites/tank_green.png"].texture, 4.5, 0.07, 0.1);
    space.press = this.player.fire;

    playerContainer.addChild(player.sprite);

    balls['ball1'] = new Ball('ball1', app.screen.width/4, app.screen.height/4, 0, 2, tex_ballPurple);
    balls['ball2'] = new Ball('ball2', app.screen.width/3 + 200, app.screen.height/3, 0, 2, tex_ballOrange);
    balls['ball3'] = new Ball('ball3', app.screen.width/3, app.screen.height/3, 0, 2, tex_ballRed);
    ballContainer.addChild(balls['ball1'].sprite);
    ballContainer.addChild(balls['ball2'].sprite);
    ballContainer.addChild(balls['ball3'].sprite);

    app.stage.addChild(gameScene);
    app.stage.addChild(playerContainer);
    app.stage.addChild(tankContainer);
    app.stage.addChild(ballContainer);

    app.ticker.add(delta => gameLoop(delta));

    /* socket update */
    socket.on('updateClient', function(serverData) {
            let isempty = Object.keys(tanks).length === 0;
            for (var clientId in serverData) {
                if (clientId === "/#" + socket.id) {
                    player.sprite.x = serverData[clientId].x;
                    player.sprite.y = serverData[clientId].y;
                    player.sprite.rotation = serverData[clientId].rotation;
                } else {
                    if (!tanks.hasOwnProperty(clientId)) {
                        var tank = new Tank(
                            clientId,
                            serverData[clientId].x,
                            serverData[clientId].y,
                            serverData[clientId].rotation,
                            PIXI.loader.resources["./assets/sprites/tank_blue.png"].texture
                        );
                        
                        tanks[clientId] = tank;
                        tankContainer.addChild(tanks[clientId].sprite);
                    } else {
                        tanks[clientId].sprite.x = serverData[clientId].x;
                        tanks[clientId].sprite.y = serverData[clientId].y;
                       tanks[clientId].sprite.rotation = serverData[clientId].rotation;
                }
            }

        }
        
        if (isempty) { socket.emit('getBalls'); }

    });

}



socket.on('setBalls', function(serverData) {

    balls['ball1'].parentId = serverData['ball1'].parentId;
    balls['ball2'].parentId = serverData['ball2'].parentId;
    balls['ball3'].parentId = serverData['ball3'].parentId;

    balls['ball1'].state = serverData['ball1'].state;
    balls['ball2'].state = serverData['ball2'].state;
    balls['ball3'].state = serverData['ball3'].state;
    

});

/* socket handle non-guarenteed data (i.e. non-essential data) */
socket.on('handleNonGuaranteed', function(serverData) {
    var newtracks = new Tracks(serverData.x, serverData.y, serverData.rotation);
    gameScene.addChild(newtracks.sprite);
    tracks.push(newtracks);
});


/* socket handle disconnection */
socket.on('handleDisconnect', function(serverData) {
    tankContainer.removeChild(tanks[serverData.clientId].sprite);
    tanks[serverData.clientId].sprite.destroy(false);
    /*if (tanks[ServerData.clientId].holding.length > 0) {
        for (var bl = 0; bl < tanks[ServerData.clientId].holding.length; bl++) {
            tanks[ServerData.clientId].holding[bl].parentId = '';
            tanks[ServerData.clientId].holding[bl].state = BALL_STATE.IDLE;
            socket.emit('updateBallState', { ballId: tanks[ServerData.clientId].holding[bl].ballId, parentId: '', state: tanks[ServerData.clientId].holding[bl].state  });
        }
    }*/
    delete tanks[serverData.clientId];
});

/* socket handle ball state change */
socket.on('ballStateChange', function(serverData) {
    balls[serverData.ballId].state = serverData.state;
    balls[serverData.ballId].parentId = serverData.parentId;
    console.log(serverData);
});





/* ### GAME LOOP ### */
function gameLoop(delta) {
    player.updatePlayer(delta);

    if (tracks.length > 0) {
        for (var tr = 0; tr < tracks.length; tr++) {
            let isFaded = tracks[tr].fade(); 
            if (isFaded) { gameScene.removeChild(tracks[tr].sprite); tracks[tr].sprite.destroy(false); tracks.splice(tr, 1); }
        }
    }

    for (var ballid in balls) {
        balls[ballid].updateBall(delta);
    }
    
}

/************************************************************ */
/************************************************************ */
/************************************************************ */
/************************************************************ */
/************************************************************ */

/* Player */
function Player(init_socket, init_x, init_y, init_mass, init_tex, init_maxv, init_acc, init_dec) {
    this.io = init_socket;
    this.sprite = new PIXI.Sprite(init_tex);
    this.sprite.zIndex = 5;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = init_x;
    this.sprite.y = init_y;
    this.sprite.mass = init_mass;
    this.maxv = init_maxv;
    this.acc = init_acc;
    this.dec = init_dec;
    this.sprite.vx = 0;
    this.sprite.vy = 0;
    this.holding = [];

    this.io.emit('updateServer', {x: this.sprite.x, y: this.sprite.y, rotation: this.sprite.rotation });
}

Player.prototype.updatePlayer = function(delta) {
    var vm = this;
    let payload = { x: this.sprite.x, y: this.sprite.y, rotation: this.sprite.rotation, track: false };
    let sendPayload = false;

    if (left.isDown && !right.isDown) {
        //this.sprite.rotation = this.sprite.rotation - (0.07 * delta);
        payload.rotation = this.sprite.rotation - (0.07 * delta);
        sendPayload = true;
    } else if (right.isDown && !left.isDown) {
        //this.sprite.rotation = this.sprite.rotation + (0.07 * delta);
        payload.rotation = this.sprite.rotation + (0.07 * delta);
        sendPayload = true;
    }

    if (up.isDown) {

        if (this.sprite.vx < this.maxv) { this.sprite.vx += this.acc; }
        if (this.sprite.vy < this.maxv) { this.sprite.vy += this.acc; }

        //this.sprite.x = this.sprite.x + this.sprite.vx * Math.cos(this.sprite.rotation);
        //this.sprite.y = this.sprite.y + this.sprite.vy * Math.sin(this.sprite.rotation);
        payload.x = this.sprite.x + (this.sprite.vx*delta) * Math.cos(this.sprite.rotation);
        payload.y = this.sprite.y + (this.sprite.vy*delta) * Math.sin(this.sprite.rotation);
        
        up.time_elapsed += 1;
        if (up.time_elapsed > 12) {  up.time_elapsed = 0; payload.track = true; /*this.createTrack();*/ }

        sendPayload = true;
    } else {
        if (this.sprite.vx > 0 || this.sprite.vy > 0) {
            this.sprite.vx -= this.dec;
            this.sprite.vy -= this.dec;
            
            //this.sprite.x = this.sprite.x + this.sprite.vx * Math.cos(this.sprite.rotation);
            //this.sprite.y = this.sprite.y + this.sprite.vy * Math.sin(this.sprite.rotation);
            payload.x = this.sprite.x + (this.sprite.vx*delta) * Math.cos(this.sprite.rotation);
            payload.y = this.sprite.y + (this.sprite.vy*delta) * Math.sin(this.sprite.rotation);

            up.time_elapsed += 1;
            if (up.time_elapsed > 12) {  up.time_elapsed = 0; payload.track = true; /*this.createTrack();*/ }

            sendPayload = true;
        }
    }





    let hit = bump.hit(player.sprite, getTanks());
    if (hit) {
        let playerHitTank = bump.hit(player.sprite, getTanks(), true, false, false, function(collision, othersprite) {
            //console.log("COLLIDED");
            //console.log(collision);
            vm.io.emit('updateServer', { x: collision.x, y: collision.y, rotation: player.sprite.rotation });
        });
    } else if (sendPayload) {
        this.io.emit('updateServer', payload);
    }
};

Player.prototype.createTrack = function() {
    var newtracks = new Tracks(this.sprite.x, this.sprite.y, this.sprite.rotation);
    gameScene.addChild(newtracks.sprite);
    tracks.push(newtracks);
};

Player.prototype.fire = () => {
    if (player.holding.length > 0) {
        player.holding[0].shoot(player.sprite.x, player.sprite.y, player.sprite.rotation);
        player.holding.splice(0, 1);
    }
};



/* util functions */
function getTanks(excludeClientId=null) {
    var tanksprites = [];
    for (let [key, value] of Object.entries(tanks)) {
        if (excludeClientId === null) {
            tanksprites.push(value.sprite);
        } else {
            if (excludeClientId != key) {
                tanksprites.push(value.sprite);
            }
        }
    }
    return tanksprites;
}

/* Tracks */
function Tracks(init_x, init_y, init_rot) {
    this.sprite = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tracksSmall.png"].texture);
    this.sprite.zIndex = 0;
    this.sprite.anchor.set(1, 0.5);
    this.sprite.x = init_x;
    this.sprite.y = init_y;
    this.sprite.rotation = init_rot;
    this.counter = 0;
}

Tracks.prototype.fade = function() {
    this.counter += 1;
    if (this.counter % 30 == 0) { this.sprite.alpha = this.sprite.alpha - 0.3; }
    return this.sprite.alpha < 0.1;
}


/* Other Player Tank */
function Tank(init_clientId, init_x, init_y, init_rot, init_tex) {
    this.clientId = init_clientId;
    this.sprite = new PIXI.Sprite(init_tex);
    this.sprite.zIndex = 5;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = init_x;
    this.sprite.y = init_y;
    this.sprite.rotation = init_rot;
};

/* Ball */
function Ball(init_ballId, init_x, init_y, init_rot, init_mass, init_tex) {
    this.state = BALL_STATE.IDLE;
    this.ballId = init_ballId;
    this.sprite = new PIXI.Sprite(init_tex);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = init_x;
    this.sprite.y = init_y;
    this.sprite.rotation = init_rot;
    this.sprite.mass = init_mass;
    this.sprite.vx = 0;
    this.sprite.vy = 0;
    this.sprite.zIndex = 10;
    this.parentId = '';
    this.speed = 0;
}

Ball.prototype.updateBall = function(delta) {

    if (this.state === BALL_STATE.IDLE) {
        let hit = bump.hit(player.sprite, this.sprite);
        if (hit && player.holding.length < 3) {
            this.state = BALL_STATE.HELD;
            this.parentId = "/#" + socket.id;
            this.sprite.x = player.sprite.x;
            this.sprite.y = player.sprite.y;
            this.sprite.rotation = player.sprite.rotation;
            player.holding.push(this);
            if (player.holding.length === 1) { this.sprite.anchor.set(0, 0); this.sprite.zIndex = 10 + 3; }
            else if (player.holding.length === 2) { this.sprite.anchor.set(0.5, 0); this.sprite.zIndex = 10 + 2; }
            else if (player.holding.length === 3) { this.sprite.anchor.set(1, 0); this.sprite.zIndex = 10 + 1; }
            socket.emit('updateBallState', { ballId: this.ballId, parentId: "/#" + socket.id, state: this.state  });
        }
    }

    if (this.state === BALL_STATE.HELD) {
        if ("/#" + socket.id == this.parentId) {
            this.sprite.x = player.sprite.x;
            this.sprite.y = player.sprite.y;
            this.sprite.rotation = player.sprite.rotation;
        } else if (tanks[this.parentId]) {
            this.sprite.x = tanks[this.parentId].sprite.x;
            this.sprite.y = tanks[this.parentId].sprite.y;
            this.sprite.rotation = tanks[this.parentId].sprite.rotation;
        }

    }

    if (this.state === BALL_STATE.MOVING) {
        this.sprite.x = this.sprite.x + (this.speed*delta) * Math.cos(this.sprite.rotation);
        this.sprite.y = this.sprite.y + (this.speed*delta) * Math.sin(this.sprite.rotation);
        this.speed -= 0.1;

        if (this.speed < 1) {
            this.parentId = '';
            this.state = BALL_STATE.IDLE;
            socket.emit('updateBallState', { ballId: this.ballId, parentId: '', state: this.state  });
            this.speed = 0;
        }
    }
};


Ball.prototype.shoot = function(fromx, fromy, fromrot) {
    this.sprite.anchor.set(0.5, 0.5);
    this.parentId = '';
    this.state = BALL_STATE.MOVING;
    this.sprite.rotation = fromrot;
    this.sprite.x = fromx + 40 * Math.cos(fromrot);
    this.sprite.y = fromy + 40 * Math.sin(fromrot);
    this.speed = 10;
};



