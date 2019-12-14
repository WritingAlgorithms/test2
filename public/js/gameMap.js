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
    "./assets/sprites/barrelGreen_side.png"
]).load(setup);


function setup() {

    var tilingSprite = new PIXI.TilingSprite(
        PIXI.loader.resources["./assets/sprites/tileSand1.png"].texture,
        app.renderer.width,
        app.renderer.height
    );

    gameScene.addChild(tilingSprite);

    var starty = (60 * getRandomInt(app.screen.height/60)) + 60;
    var tile = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tileSand_roadEast.png"].texture);

    for (var i = 0; i < Math.floor(app.screen.width/60)+60; i++) {
        var tile = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tileSand_roadEast.png"].texture);
        var rand = getRandomInt(15);

        if (rand > 13) {
            tile = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tileSand_roadCrossing.png"].texture);
            for (var j = 0; j < app.screen.height - starty; j++) {
                var verttile = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tileSand_roadNorth.png"].texture);
                verttile.anchor.set(0.5, 0.5);
                verttile.x = i*60;
                verttile.y = starty - j * 60;
                gameScene.addChild(verttile);
                var verttile2 = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tileSand_roadNorth.png"].texture);
                verttile2.anchor.set(0.5, 0.5);
                verttile2.x = i*60;
                verttile2.y = starty + j * 60;
                gameScene.addChild(verttile2);
            }
        }


        tile.anchor.set(0.5, 0.5);
        tile.x = 0 + (i * 60);
        tile.y = starty;
        gameScene.addChild(tile);
    }


    var sprite_list = [
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
        "./assets/sprites/barrelGreen_side.png"
    ];
    for (var k = 0; k < 12; k++) {
        var rand2 = getRandomInt(5);
        if (rand2 > 3) {
            var randidx = getRandomInt(11);
            var newextra = new PIXI.Sprite(PIXI.loader.resources[sprite_list[randidx]].texture);
            newextra.anchor.set(0.5, 0.5);
            newextra.x = getRandomInt(app.screen.width);
            newextra.y = getRandomInt(app.screen.height);
            newextra.angle = getRandomInt(360);

            gameScene.addChild(newextra);
        }
    }


    app.stage.addChild(gameScene);
}


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}


function gameLoop(delta) {

}