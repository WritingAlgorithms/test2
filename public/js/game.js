var tanks = {};
var balls = {};
var player;
var texBallPurple;
var tracks = [];
var left = keyboard("ArrowLeft"); left.press = () => {};
var right = keyboard("ArrowRight"); right.press = () => {};
var up = keyboard("ArrowUp"); up.press = () => {};
var space = keyboard(" "); space.press = () => {};

var app = new PIXI.Application({ 
    width: 600,         // default: 800
    height: 400,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
  }
);

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(1000, 500);
app.renderer.view.style.left = ((window.innerWidth - app.renderer.width) >> 1) + 'px';
document.body.appendChild(app.view);

var bump = new Bump(app.renderer);
var gameScene = new PIXI.Container();
gameScene.sortableChildren = true;

var socket = io();

socket.on('connect', function() {
    PIXI.loader.add([
        "./assets/sprites/tileSand1.png",
        "./assets/sprites/tileSand2.png",
        "./assets/sprites/tank_green.png",
        "./assets/sprites/tank_blue.png",
        "./assets/sprites/tracksSmall.png",
        "./assets/sprites/shotThin.png",
        "./assets/sprites/tileSand_roadEast.png",
        "./assets/sprites/tileSand_roadSplitE.png",
        "./assets/sprites/tileSand_roadSplitS.png",
        "./assets/sprites/tileSand_roadSplitW.png",
        "./assets/sprites/tileSand_roadNorth.png",
        "./assets/sprites/tileSand_roadSplitN.png",
        "./assets/sprites/tileSand_roadCrossing.png",
        "./assets/sprites/treeGreen_large.png",
        "./assets/sprites/treeBrown_large.png",
        "./assets/sprites/sandbagBeige.png",
        "./assets/sprites/sandbagBrown.png",
        "./assets/sprites/fenceYellow.png",
        "./assets/sprites/crateWood.png",
        "./assets/sprites/crateMetal.png",
        "./assets/sprites/barrelRust_top.png",
        "./assets/sprites/barrelRust_side.png",
        "./assets/sprites/barrelGreen_top.png",
        "./assets/sprites/barrelGreen_side.png",
        "./assets/sprites/tankBody_blue.png",
        "./assets/sprites/tankBody_red.png",
        "./assets/sprites/tankBlue_barrel2_outline.png",
        "./assets/sprites/tankRed_barrel2_outline.png"
    ]).load(setup);
});


function setup() {

    var gr = new PIXI.Graphics();
    gr.beginFill(0x9966FF);
    gr.drawCircle(app.screen.width / 3, app.screen.height / 3, 6);
    gr.endFill();
    texBallPurple = app.renderer.generateTexture(gr);
    gr.clear();

    var tilingSprite = new PIXI.TilingSprite(
        PIXI.loader.resources["./assets/sprites/tileSand1.png"].texture,
        app.renderer.width,
        app.renderer.height
    );

    gameScene.addChild(tilingSprite);

    for (var i = 0; i < terrainMap.length; i++) {
        for (var j = 0; j < terrainMap[i].length; j++) {
            if (terrainMap[i][j] > 0) {
                var terrainpath = "";
                if (terrainMap[i][j] === 1) { terrainpath = "./assets/sprites/tileSand_roadEast.png"; }
                else if (terrainMap[i][j] === 2) { terrainpath = "./assets/sprites/tileSand_roadNorth.png"; }
                else if (terrainMap[i][j] === 3) { terrainpath = "./assets/sprites/tileSand_roadCrossing.png"; }

                var newroad = new PIXI.Sprite(PIXI.loader.resources[terrainpath].texture);
                newroad.anchor.set(0.5, 0.5);
                newroad.x = (j*60);
                newroad.y = (i*60);

                gameScene.addChild(newroad);
            }
        }
    }

    player = new Tank("/#"+socket.id, 150, 150, "blue");
    gameScene.addChild(player.sprite);
    gameScene.addChild(player.barrel);

    app.stage.addChild(gameScene);

    app.ticker.add(delta => gameLoop(delta));

    
    socket.emit('getTanks');
    socket.emit('getBalls');


}

var payload, sendpayload, newx, newy;
function gameLoop(delta) {

    if (tracks.length > 0) {
        for (var tr = 0; tr < tracks.length; tr++) {
            let isFaded = tracks[tr].fade(); 
            if (isFaded) { gameScene.removeChild(tracks[tr].sprite); tracks[tr].sprite.destroy(false); tracks.splice(tr, 1); }
        }
    }

    player.barrel.x = player.sprite.x;
    player.barrel.y = player.sprite.y;
    player.barrel.rotation = rotateToPoint(app.renderer.plugins.interaction.mouse.global.x, app.renderer.plugins.interaction.mouse.global.y, player.barrel.x, player.barrel.y);

    sendpayload = false;
    payload = { tankId: "/#"+socket.id, x: player.sprite.x, y: player.sprite.y, rotation: player.sprite.rotation, barrelRotation: player.barrel.rotation };
    
    let tankCollided = bump.hit(player.sprite, getTanks(), true, true, false, function(collision, othersprite) {
        // collided
    });

    if (tankCollided) {
        payload.x = player.sprite.x;
        payload.y = player.sprite.y;
    }


    getBalls(delta);
    //let ballCollided = bump.hit(player.sprite, getBalls(), true, true, false, function(collision, othersprite) {});




    
    if (left.isDown && !right.isDown) {
        payload.rotation = player.sprite.rotation - (0.07 * delta); sendpayload = true;
    } else if (right.isDown && !left.isDown) {
        payload.rotation = player.sprite.rotation + (0.07 * delta); sendpayload = true;
    }



    if (up.isDown) {
        var acc = !tankCollided ? 4.5 : 0;
        newx = player.sprite.x + (acc*delta) * Math.cos(player.sprite.rotation);
        newy = player.sprite.y + (acc*delta) * Math.sin(player.sprite.rotation);
        payload.x = newx < 1000-(player.sprite.width-12) && newx > (player.sprite.width-12) ? newx : player.sprite.x;
        payload.y = newy > (player.sprite.height-12) && newy < 500-(player.sprite.height-12) ? newy : player.sprite.y;
        sendpayload = true;
        payload.forward = true;
    }

    
    space.press = function() {
    //if (space.isDown) {

        if (player.ammo.length > 0) {
            console.log(player.ammo);
            var shootballid = player.ammo[player.ammo.length-1].ballId;
            player.ammo.pop();
            payload.ballId = shootballid;
            console.log(payload);
            let ballpayload = Object.assign({}, payload);
            let newballx = player.sprite.x + (45*delta) * Math.cos(player.barrel.rotation);
            let newbally = player.sprite.y + (45*delta) * Math.sin(player.barrel.rotation);
            ballpayload.x = newballx;
            ballpayload.y = newbally;

            socket.emit('shootBall', ballpayload);
        }

        sendpayload = true;
    }
    //}


    if (sendpayload) { 
        socket.emit('updatePlayer', payload); 
    }
}


/*************************************************** */

socket.on('updateTank', function(serverData) {
    tanks[serverData.tankId].sprite.x = serverData.x;
    tanks[serverData.tankId].sprite.y = serverData.y;
    tanks[serverData.tankId].sprite.rotation = serverData.rotation;
    tanks[serverData.tankId].barrel.x = serverData.x;
    tanks[serverData.tankId].barrel.y = serverData.y;
    tanks[serverData.tankId].barrel.rotation = serverData.barrelRotation;

    if (serverData.forward) { tanks[serverData.tankId].steps += 1; }
    createTracks(serverData.tankId);
});

socket.on('newTanks', function(serverData) {
    for (var tankid in serverData) {
        if (!tanks.hasOwnProperty(tankid)) {
            var newtank = new Tank(serverData[tankid].tankId, serverData[tankid].x, serverData[tankid].y, "red");
            newtank.sprite.rotation = serverData[tankid].rotation;
            gameScene.addChild(newtank.sprite);
            gameScene.addChild(newtank.barrel);
        }
    }
});

socket.on('newBalls', function(serverData) {
    for (var ballid in serverData) {
        if (!balls.hasOwnProperty(ballid)) {
            var newball = new Ball(ballid, serverData[ballid].x, serverData[ballid].y, serverData[ballid].rotation, texBallPurple);
            newball.carrier = serverData[ballid].carrier;
            gameScene.addChild(newball.sprite);
        }
    }
});

socket.on('removeTank', function(serverData) {
    gameScene.removeChild(tanks[serverData.tankId].sprite);
    gameScene.removeChild(tanks[serverData.tankId].barrel);
    tanks[serverData.tankId].sprite.destroy(false);
    tanks[serverData.tankId].barrel.destroy(false);
    delete tanks[serverData.tankId];
});


socket.on('ballPickedup', function(serverData) {
    balls[serverData.ballId].carrier = serverData.tankId;
    tanks[serverData.tankId].ammo.unshift(balls[serverData.ballId]);
});

socket.on('shootingBall', function(serverData) {
    console.log("SHOTING BSLAL");
    console.log(serverData);
    balls[serverData.ballId].sprite.rotation = serverData.rotation;
    balls[serverData.ballId].sprite.x = serverData.x;
    balls[serverData.ballId].sprite.y = serverData.y;
    balls[serverData.ballId].sprite.vx = 12;
    balls[serverData.ballId].sprite.vy = 12;
    balls[serverData.ballId].carrier = "moving";
});

socket.on('ballBounced', function(serverData) {
    balls[serverData.ballId].sprite.rotation = serverData.rotation;
    //balls[serverData.ballId].sprite.vx = serverData.v;
    //balls[serverData.ballId].sprite.vy = serverData.v;

    if (balls[serverData.ballId].sprite.vx < 0 && balls[serverData.ballId].sprite.vx < -3) {
        balls[serverData.ballId].sprite.vx += 0.25;
    } else if (balls[serverData.ballId].sprite.vx > 0 && balls[serverData.ballId].sprite.vx > 3) {
        balls[serverData.ballId].sprite.vx -= 0.25;
    }

    if (balls[serverData.ballId].sprite.vy < 0 && balls[serverData.ballId].sprite.vy < -3) {
        balls[serverData.ballId].sprite.vy += 0.25;
    } else if (balls[serverData.ballId].sprite.vx > 0 && balls[serverData.ballId].sprite.vy > 3) {
        balls[serverData.ballId].sprite.vy -= 0.25;
    }

    if (serverData.side == 'bottom' || serverData.side == 'top') { 
        balls[serverData.ballId].sprite.vy = -balls[serverData.ballId].sprite.vy;
    } else if (serverData.side == 'left' || serverData.side == 'right') {
        balls[serverData.ballId].sprite.vx = -balls[serverData.ballId].sprite.vx;
    }

    balls[serverData.ballId].carrier = 'moving';
});


/*socket.on('ballChanges', function(serverData) {
    balls[serverData.ballId].sprite.rotation = serverData.rotation;
    balls[serverData.ballId].sprite.x = serverData.x;
    balls[serverData.ballId].sprite.y = serverData.y;
});*/

/*********************************************** */

function getTanks() {
    var ret = [], ignoreId = "/#"+socket.id;
    for (var tankid in tanks) {
        if (tankid != ignoreId) {
            ret.push(tanks[tankid].sprite);
        }
    }
    return ret;
}

function getBalls(delta) {
    for (var ballid in balls) {
        //console.log(balls[ballid].carrier);
        if (balls[ballid].carrier == "idle") {
            let ballCollided = bump.hit(player.sprite, balls[ballid].sprite, true, true, false, function(collision, othersprite) {
                // collided
            });

            if (ballCollided) {
                socket.emit('ballPickup', { ballId: ballid, tankId: player.tankId });
            }
        } else if (balls[ballid].carrier != "moving" && balls[ballid].carrier != "bounce") {
            balls[ballid].sprite.x = tanks[balls[ballid].carrier].sprite.x;
            balls[ballid].sprite.y = tanks[balls[ballid].carrier].sprite.y;
            balls[ballid].sprite.rotation = tanks[balls[ballid].carrier].sprite.rotation;
        } else if (balls[ballid].carrier == "moving") {
            // instead on server check for balls in moving state within the game loop.
            // if one is found, recalculate its x,y and io.emit();
            // update: nvm if sever handles it is way too slow even when sending every 50ms
            /*let ballMovingCollided = bump.hit(balls[ballid].sprite, getTanks(), true, false, false, function(collision, othersprite) {
                // collided
            });
            if (ballMovingCollided) {
                //balls[ballid].carrier = 'bounce';
                balls[ballid].sprite.rotation = balls[ballid].sprite.rotation - 1.57;
                balls[ballid].sprite.vx = balls[ballid].sprite.vx * 0.75;
                balls[ballid].sprite.vy = balls[ballid].sprite.vy * 0.75;
            }*/

            let ballOtherMovingCollided = bump.hit(balls[ballid].sprite, getTanks(), true, false, false, function(collision, othersprite) {
            });

            let ballMovingCollided = bump.hit(balls[ballid].sprite, player.sprite, true, false, false, function(collision, othersprite) {
                // collided
                console.log(collision);
                socket.emit('ballBounce', {
                    ballId: ballid,
                    rotation: balls[ballid].sprite.rotation - 1.57,
                    v: (balls[ballid].sprite.vx * 0.75),
                    side: collision
                });
                //balls[ballid].carrier = 'bounce';
            });

            /*if (ballMovingCollided) {
                socket.emit('ballBounce', {
                    ballId: ballid,
                    rotation: balls[ballid].sprite.rotation - 1.57,
                    v: (balls[ballid].sprite.vx * 0.75) + 0.25
                });

                
            }*/

            let newboundx = balls[ballid].sprite.x + (balls[ballid].sprite.vx*delta) * Math.cos(balls[ballid].sprite.rotation);
            let newboundy = balls[ballid].sprite.y + (balls[ballid].sprite.vy*delta) * Math.sin(balls[ballid].sprite.rotation);
            if (newboundx >= 1000-(balls[ballid].sprite.width-6) 
                || newboundx <= (0 + balls[ballid].sprite.width-6)) {
                    balls[ballid].sprite.vx = -balls[ballid].sprite.vx;
            }
            if (newboundy <= (0 + balls[ballid].sprite.height-6) 
                || newboundy >= 500-(balls[ballid].sprite.height-6)) {
                    balls[ballid].sprite.vy = -balls[ballid].sprite.vy;
            }

            if (balls[ballid].sprite.vx === 0 || balls[ballid].sprite.vy === 0) { 
                balls[ballid].sprite.vx = 0;
                balls[ballid].sprite.vy = 0;
                balls[ballid].carrier = "idle";
                socket.emit('ballIdle', {
                    ballId: ballid,
                    x: balls[ballid].sprite.x,
                    y: balls[ballid].sprite.y,
                    rotation: balls[ballid].sprite.rotation
                });
            }
            if (balls[ballid].sprite.vx < 0) { balls[ballid].sprite.vx += 0.0625; }
            else if (balls[ballid].sprite.vx > 0) { balls[ballid].sprite.vx -= 0.0625; }
            
            if (balls[ballid].sprite.vy < 0) { balls[ballid].sprite.vy += 0.0625; }
            else if (balls[ballid].sprite.vy > 0) { balls[ballid].sprite.vy -= 0.0625; }

            /*{
                balls[ballid].sprite.rotation = balls[ballid].sprite.rotation - 1.57;
                balls[ballid].sprite.vx = (balls[ballid].sprite.vx * 0.75) + 0.25;
                balls[ballid].sprite.vy = (balls[ballid].sprite.vy * 0.75) + 0.25;
            }*/
            


            balls[ballid].sprite.x = balls[ballid].sprite.x + (balls[ballid].sprite.vx*delta) * Math.cos(balls[ballid].sprite.rotation);
            balls[ballid].sprite.y = balls[ballid].sprite.y + (balls[ballid].sprite.vy*delta) * Math.sin(balls[ballid].sprite.rotation);
            
            //balls[ballid].sprite.vx -= 0.0625;
            //balls[ballid].sprite.vy -= 0.0625;

            /*if (balls[ballid].sprite.vx < 0) { 
                balls[ballid].sprite.vx = 0;
                balls[ballid].sprite.vy = 0;
                balls[ballid].carrier = "idle";
                socket.emit('ballIdle', {
                    ballId: ballid,
                    x: balls[ballid].sprite.x,
                    y: balls[ballid].sprite.y,
                    rotation: balls[ballid].sprite.rotation
                });
            }*/
            
        }
    }
}

function createTracks(tankid) {
    if (tanks[tankid].steps > 11) {
        var newtracks = new Tracks(tanks[tankid].sprite.x, tanks[tankid].sprite.y, tanks[tankid].sprite.rotation);
        gameScene.addChild(newtracks.sprite);
        tracks.push(newtracks);
        tanks[tankid].steps = 0;
    }
}

function rotateToPoint(mx, my, px, py) {  
    var self = this;
    var dist_Y = my - py;
    var dist_X = mx - px;
    var angle = Math.atan2(dist_Y,dist_X);
    //var degrees = angle * 180/ Math.PI;
    return angle;
}

/*************************************************** */

function Tank(tankId, posx, posy, team) {
    this.tankId = tankId;
    this.steps = 0;
    this.ammo = [];
    this.sprite = new PIXI.Sprite(PIXI.loader.resources[team == "blue" ? "./assets/sprites/tankBody_blue.png" : "./assets/sprites/tankBody_red.png"].texture);
    this.barrel = new PIXI.Sprite(PIXI.loader.resources[team == "blue" ? "./assets/sprites/tankBlue_barrel2_outline.png" : "./assets/sprites/tankRed_barrel2_outline.png"].texture);
    this.sprite.zIndex = 5;
    this.barrel.zIndex = 10;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = posx;
    this.sprite.y = posy;

    this.barrel.anchor.set(0, 0.5);
    this.barrel.x = posx;
    this.barrel.y = posy;

    tanks[this.tankId] = this;
}


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
    if (this.counter % 30 == 0) { this.sprite.alpha = this.sprite.alpha - 0.6; }
    return this.sprite.alpha < 0.1;
}


function Ball(ballId, init_x, init_y, init_rot, init_color) {
    this.ballId = ballId;
    this.carrier = 'idle';
    this.speed = 0;
    this.maxspeed = 8;
    this.sprite = new PIXI.Sprite(init_color);
    this.sprite.zIndex = 15;
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = init_x;
    this.sprite.y = init_y;
    this.sprite.rotation = init_rot;

    balls[this.ballId] = this;
}



