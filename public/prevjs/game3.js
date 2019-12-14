var gameState;
var player;
var ball, ball2, ball3;
var left = keyboard("ArrowLeft"); left.press = () => {};
var right = keyboard("ArrowRight"); right.press = () => {};
var up = keyboard("ArrowUp"); up.press = () => {};
var space = keyboard(" "); space.press = () => {};

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
var containerTracks = new PIXI.Container();

var tex_ballPurple, tex_ballOrange, tex_ballRed;
var gr = new PIXI.Graphics();
gr.beginFill(0x9966FF);
gr.drawCircle(app.screen.width / 3, app.screen.height / 3, 12);
gr.endFill();
tex_ballPurple = app.renderer.generateTexture(gr);
gr.clear();

gr.beginFill(0xFFA500);
gr.drawCircle(app.screen.width - 200, app.screen.height - 200, 12);
gr.endFill();
tex_ballOrange = app.renderer.generateTexture(gr);
gr.clear();

gr.beginFill(0xFF0000);
gr.drawCircle(app.screen.width - 500, app.screen.height - 500, 12);
gr.endFill();
tex_ballRed = app.renderer.generateTexture(gr);
gr.clear();
var player, ball;
var bump = new Bump(app.renderer);

function Player(init_x, init_y, init_tex, init_mass, init_vx, init_vy) {
    this.sprite = new PIXI.Sprite(init_tex);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = init_x;
    this.sprite.y = init_y;
    this.sprite.mass = init_mass;
    this.sprite.vx = init_vx;
    this.sprite.vy = init_vy;    
}

Player.prototype.updatePlayer = function(delta) {
    if (left.isDown && !right.isDown) {
        this.sprite.rotation = this.sprite.rotation - (0.07 * delta);
    } else if (right.isDown && !left.isDown) {
        this.sprite.rotation = this.sprite.rotation + (0.07 * delta);
    }

    if (up.isDown) {
        this.sprite.x = this.sprite.x + this.sprite.vx * Math.cos(this.sprite.rotation);
        this.sprite.y = this.sprite.y + this.sprite.vy * Math.sin(this.sprite.rotation);
        //up.time_elapsed += 1;if (up.time_elapsed > 12) {up.time_elapsed = 0;}
    }

};


function Ball(init_x, init_y, init_tex, init_mass) {
    this.sprite = new PIXI.Sprite(init_tex);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.x = init_x;
    this.sprite.y = init_y;
    this.sprite.mass = init_mass;
    this.sprite.vx = 0;
    this.sprite.vy = 0;

}


Ball.prototype.updateBall = function(delta, rot) {
    if (rot != undefined) { this.sprite.rotation = rot; }
    this.sprite.x = this.sprite.x + this.sprite.vx * Math.cos(this.sprite.rotation);
    this.sprite.y = this.sprite.y + this.sprite.vy * Math.sin(this.sprite.rotation);

    if (this.sprite.vx < -1) {
        this.sprite.vx += 0.05;//((this.sprite.mass * this.sprite.vx) / delta) / this.sprite.mass;
    } else if (this.sprite.vx > 1) {
        this.sprite.vx -= 0.05;//((this.sprite.mass * this.sprite.vx) / delta) / this.sprite.mass;
    } else {
        this.sprite.vx = 0;
    }

    if (this.sprite.vy < -1) {
        this.sprite.vy += 0.05;//((this.sprite.mass * this.sprite.vy) / delta) / this.sprite.mass;
    } else if (this.sprite.vy > 1) {
        this.sprite.vy -= 0.05;//((this.sprite.mass * this.sprite.vy) / delta) / this.sprite.mass;
    } else {
        this.sprite.vy = 0;
    }
    
};




var sceneContainer = new PIXI.Container();
var tankContainer = new PIXI.Container();
var ballContainer = new PIXI.Container();
PIXI.loader.add([
    "./assets/sprites/tileSand1.png",
    "./assets/sprites/tileSand2.png",
    "./assets/sprites/tank_green.png",
    "./assets/sprites/tank_blue.png",
    "./assets/sprites/tracksSmall.png",
    "./assets/sprites/bulletBlue1.png",
    "./assets/sprites/shotThin.png"
]).load(setup);

function setup() {
    var tilingSprite = new PIXI.TilingSprite(
        PIXI.loader.resources["./assets/sprites/tileSand1.png"].texture,
        app.renderer.width,
        app.renderer.height
    );

    sceneContainer.addChild(tilingSprite);

    player = new Player(
        app.screen.width / 2, 
        app.screen.height / 2, 
        PIXI.loader.resources["./assets/sprites/tank_green.png"].texture,
        4, 5, 5
    );
    
    tankContainer.addChild(player.sprite);

    ball = new Ball(
      app.screen.width / 3,
      app.screen.height / 3,
      tex_ballPurple,
      2
    );

    ball2 = new Ball(
        app.screen.width / 4,
        app.screen.height / 4,
        tex_ballOrange,
        2
      );

    ballContainer.addChild(ball.sprite);
    ballContainer.addChild(ball2.sprite);

    
    app.stage.addChild(sceneContainer);
    app.stage.addChild(tankContainer);
    app.stage.addChild(ballContainer);

    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    player.updatePlayer(delta);
    ball.updateBall(delta);
    let hit = bump.hit(player.sprite, ball.sprite);
    if (hit) {
        let vdx = ((ball.sprite.mass - player.sprite.mass) / (ball.sprite.mass + player.sprite.mass))*ball.sprite.vx + ((2*player.sprite.mass) / (ball.sprite.mass + player.sprite.mass))*player.sprite.vx;
        let vdy = ((ball.sprite.mass - player.sprite.mass) / (ball.sprite.mass + player.sprite.mass))*ball.sprite.vy + ((2*player.sprite.mass) / (ball.sprite.mass + player.sprite.mass))*player.sprite.vy;;

        ball.sprite.vx = vdx;
        ball.sprite.vy = vdy;
        ball.updateBall(delta, player.sprite.rotation);

    }

    let hit2 = bump.hit(
        ball2.sprite,
        [player.sprite], 
        true, false, false, 
        function(collision, otherball){
            console.log(collision);
            console.log(otherball);
          //`collision` tells you the side on player that the collision occurred on.
          //`platform` is the sprite from the `world.platforms` array
          //that the player is colliding with


        }
      );
}









/*var b1 = new PIXI.Sprite(tex_ballOrange);
b1.anchor.set(0.5);
b1.x = app.screen.width / 2;
b1.y = app.screen.height / 2;
var b2 = new PIXI.Sprite(tex_ballPurple);
b2.anchor.set(0.5);
b2.x = (app.screen.width / 2) - 100;
b2.y = app.screen.height / 2;
b2.vx = 3;
b1.vx = 0;
b2.mass = 1;
b1.mass = 2;

app.stage.addChild(b1);
app.stage.addChild(b2);

app.ticker.add(delta => gameLoop(delta));

function gameLoop(delta) {
    let hit = bump.hit(b1, b2);
    if (hit) {
        let vd1 = ((b2.mass - b1.mass) / (b2.mass + b1.mass))*b2.vx + ((2*b1.mass)/(b2.mass+b1.mass))*b1.vx;
        //let vd1 = b2.vx - (2*b1.x/(b2.x + b1.x)) * (((b2.vx - b1.vx) * (b2.x - b1.x))) / (Math.abs(b1.x - b2.x) * Math.abs(b1.x - b2.x)) * (b2.x-b1.x); 
       // let vd1 = b2.x - (2*b2.mass/(b1.mass+b2.mass)) * (((b2.vx - b1.vx) * (b2.x - b1.x))) / (Math.abs(b1.x - b2.x) * Math.abs(b1.x - b2.x)) * (b2.x-b1.x);
       b2.x -= 5;
        b2.vx = vd1;
        console.log(b2.vx);
    }
    b2.x += b2.vx;
    
}*/