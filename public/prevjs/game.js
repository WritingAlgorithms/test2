var gameState;
var player;
var trackTimers = [];
var playerLastDir = undefined;
var left = keyboard("ArrowLeft"); left.press = () => {};
var right = keyboard("ArrowRight"); right.press = () => {};
var up = keyboard("ArrowUp"); up.press = () => {};

var m=2.5, v=16, p=m*v, a=0, tm=1;

var ballspr;

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

var gameScene = new PIXI.Container();
var containerTracks = new PIXI.Container();
PIXI.loader.add([
    "./assets/sprites/tileSand1.png",
    "./assets/sprites/tileSand2.png",
    "./assets/sprites/tank_green.png",
    "./assets/sprites/tracksSmall.png",
    "./assets/sprites/bulletBlue1.png"
]).load(setTiling);

function setTiling() {
    var tilingSprite = new PIXI.TilingSprite(
        PIXI.loader.resources["./assets/sprites/tileSand1.png"].texture,
        app.renderer.width,
        app.renderer.height
    );

    player = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tank_green.png"].texture);
    player.anchor.set(0.5, 0.5);
    player.x = app.screen.width / 2;
    player.y = app.screen.height / 2;

    ballspr = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/bulletBlue1.png"].texture);
    ballspr.anchor.set(0.5, 0.5);
    ballspr.x = app.screen.width / 3;
    ballspr.y = app.screen.height / 2;
    ballspr.rotation = 0;
    a = (p / tm) / m;
    


    gameScene.addChild(tilingSprite);
    gameScene.addChild(containerTracks);
    gameScene.addChild(player);
    gameScene.addChild(ballspr);
    app.stage.addChild(gameScene);

    gameState = play;
    app.ticker.add(delta => gameLoop(delta));
}


function createTracks(x, y, rot) {
    var newtracks = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tracksSmall.png"].texture);
    newtracks.interactive = true;
    newtracks.anchor.set(0.5, 0.5);
    newtracks.rotation = player.rotation;
    newtracks.x = x;
    newtracks.y = y;
    newtracks.on('added', (event) => {
        trackTimers.push(new AppTimer(160, function() { console.log("REMOVE TIMER"); }, false));
    });

    containerTracks.addChild(newtracks);
}


function gameLoop(delta) {
    gameState(delta);
}

function play(delta) {
    if (left.isDown && !right.isDown) {
        player.rotation = player.rotation - (0.07 * delta);
        playerLastDir = 'left';
    } else if (right.isDown && !left.isDown) {
        player.rotation = player.rotation + (0.07 * delta);
        playerLastDir = 'right';
    } else if (!left.isDown && !right.isDown) {
        playerLastDir = undefined;
    } else if (left.isDown && right.isDown) {
        if (playerLastDir != undefined) {
            if (playerLastDir == 'left') { player.rotation = player.rotation - (0.07 * delta); }
            else if (playerLastDir == 'right') { player.rotation = player.rotation + (0.07 * delta); }
        }
    }

    if (up.isDown) {
        player.x = player.x + 4.5 * Math.cos(player.rotation);
        player.y = player.y + 4.5 * Math.sin(player.rotation);
        up.time_elapsed += 1;
        if (up.time_elapsed > 12) {
            createTracks(player.x, player.y, player.rotation);
            up.time_elapsed = 0;

            tm += 1;
            a = (p / tm) / m;
            console.log(a);
        }


        if (a > 1) {
        ballspr.x = ballspr.x + a * Math.cos(ballspr.rotation);
        ballspr.y = ballspr.y + a * Math.sin(ballspr.rotation);
        }
    }

    if (containerTracks.children.length > 0) {
        for (var t = 0; t < trackTimers.length; t++) {
            trackTimers[t].increment(1);
            if (trackTimers[t].time_elapsed % 30 == 0) {
                containerTracks.children[t].alpha = containerTracks.children[t].alpha - 0.2; //0.0625;
            }

            if (trackTimers[t].isDone()) {
                trackTimers.splice(0, 1);
                var rmvtrack = containerTracks.children[t];//.destroy();
                containerTracks.removeChild(rmvtrack);
                rmvtrack.destroy();
            }
        }

    }


}