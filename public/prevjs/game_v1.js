var gameState;
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
var playerContainer = new PIXI.Container();
PIXI.loader.add([
    "./assets/sprites/tileSand1.png",
    "./assets/sprites/tileSand2.png",
    "./assets/sprites/tankBody_green.png",
    "./assets/sprites/tankGreen_barrel1.png",
    "./PNG/Tanks/tankGreen.png",
    "./PNG/Tanks/barrelGreen.png",
    "./assets/sprites/tank_green.png"
]).load(setTiling);

function rotateToPoint(mx, my, px, py){  
    var self = this;
    var dist_Y = my - py;
    var dist_X = mx - px;
    var angle = Math.atan2(dist_Y,dist_X);
    //var degrees = angle * 180/ Math.PI;
    return angle;
  }

function setTiling() {
    var tilingSprite = new PIXI.TilingSprite(
        PIXI.loader.resources["./assets/sprites/tileSand1.png"].texture,
        app.renderer.width,
        app.renderer.height
    );

    //var player = new Player(app.screen.width / 2, app.screen.height / 2, "green");
    let playerBody = new PIXI.Sprite(PIXI.loader.resources["./PNG/Tanks/tankGreen.png"].texture);
    var tex =new PIXI.Texture(PIXI.loader.resources["./assets/sprites/tank_green.png"].texture, new PIXI.Rectangle(0, 6, 46, 30));
    let playerBarrel = new PIXI.Sprite(tex);
    playerBody.anchor.set(0.5, 0.5);
    playerBarrel.anchor.set(0.5, 0.5);

    playerContainer.addChild(playerBody);
    playerContainer.addChild(playerBarrel);
    playerContainer.x = app.screen.width / 2;
    playerContainer.y = app.screen.height / 2;

    gameScene.addChild(tilingSprite);
    gameScene.addChild(playerContainer);
    app.stage.addChild(gameScene);

    gameState = play;
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    gameState(delta);
}

function play(delta) {
    playerContainer.children[1].rotation = rotateToPoint(
        app.renderer.plugins.interaction.mouse.global.x,
        app.renderer.plugins.interaction.mouse.global.y,
        playerContainer.x,
        playerContainer.y
    );
    
}