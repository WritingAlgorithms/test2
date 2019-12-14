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




PIXI.loader.add([
    "./assets/sprites/tileSand1.png",
    "./assets/sprites/tileSand2.png",
    "./assets/sprites/tank_green.png",
    "./assets/sprites/tank_blue.png",
    "./assets/sprites/tracksSmall.png",
    "./assets/sprites/bulletBlue1.png",
    "./assets/sprites/shotThin.png"
]).load(setTiling);


/***************** */
/***************** */
/***************** */
const BALL_STATE = {
    IDLE: 1,
    MOVING: 2,
    CARRIED: 3
};
/***************** */



/***************** */
/***************** */
/***************** */
function Player(init_posx, init_posy) {
    this.player = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tank_green.png"].texture);
    this.shotspr = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/shotThin.png"].texture);
    this.shotspr.anchor.set(0, 0.5);
    this.shotspr.x = init_posx; this.shotspr.y = init_posy;
    this.shotspr.visible = false;
    this.shotspr_timer = 16;
    this.player.anchor.set(0.5, 0.5);
    this.player.x = init_posx;
    this.player.y = init_posy;
    this.balls = [];

    this.checkMovement = function(delta) {

        //if (space.isDown) {
            
        //}

        if (left.isDown && !right.isDown) {
            this.player.rotation = this.player.rotation - (0.07 * delta);
        } else if (right.isDown && !left.isDown) {
            this.player.rotation = this.player.rotation + (0.07 * delta);
        }
    
        if (up.isDown) {
            this.player.x = this.player.x + 4.5 * Math.cos(this.player.rotation);
            this.player.y = this.player.y + 4.5 * Math.sin(this.player.rotation);
            up.time_elapsed += 1;
            if (up.time_elapsed > 12) {
                up.time_elapsed = 0;
            }
        }

        if (this.shotspr.visible == true) {
            this.shotspr_timer -= delta;
            this.shotspr.x = this.player.x + 22 * Math.cos(this.player.rotation);
            this.shotspr.y = this.player.y + 22 * Math.sin(this.player.rotation);
            this.shotspr.rotation = this.player.rotation;
            if (this.shotspr_timer <= 0) {
                this.shotspr.visible = false;
                this.shotspr_timer = 0;
            }
        }
        

    };

    this.setPressEvent = () => {
        if (this.balls.length > 0) {
            //this.balls[0].state = BALL_STATE.MOVING; 
            this.shotspr.x = this.player.x;
            this.shotspr.y = this.player.y;
            this.shotspr.rotation = this.player.rotation;
            this.shotspr_timer = 16;
            this.shotspr.visible = true;
            this.balls[0].fire();
            this.balls.splice(0, 1); 
        }
    };

    
    this.addBall = function(newball) {
        if (this.balls.length === 0) {
            newball.shape.anchor.set(0, 1);
            newball.shape.zIndex = 5;
            //this.shape.anchor.set(0, 1);
        } else if (this.balls.length === 1) {
            newball.shape.anchor.set(0.5, 1);
            newball.shape.zIndex = 3;
        } else if (this.balls.length === 2) {
            newball.shape.anchor.set(1, 1);
            newball.shape.zIndex = 2;
        }
        this.balls.push(newball);
    };

}
/***************** */




/***************** */
/***************** */
/***************** */
function Ball(init_posx, init_posy, init_color) {
    this.state = BALL_STATE.IDLE;
    this.carrier = null;
    this.shape = new PIXI.Sprite(init_color);
    this.shape.anchor.set(0.5, 0.5);
    this.shape.x = init_posx;
    this.shape.y = init_posy;
    this.m=6;
    this.v=10;
    this.p=this.m*this.v;
    this.a=(this.p/this.tm);///this.m;
    this.tm=1;
    this.cnt = 0;
    this.hasCollided = false;
    this.setupcolliders = null;
    this.dx = 1;
    this.dy = 1;

    this.onCollide = function(collider) {
        return bump.hit(collider, this.shape);
    };

    this.setCollider = function(new_setupcolliders) {
        this.setupcolliders = new_setupcolliders;
    };

    this.ballStep = function(colliders, delta) {
        if (this.state === BALL_STATE.CARRIED) {
            this.shape.rotation = this.carrier.player.rotation;
            this.shape.x = this.carrier.player.x;
            this.shape.y = this.carrier.player.y;
        } else {
            for (var i = 0; i < colliders.length; i++) {
                if (this.onCollide(colliders[i].player, this.shape)) {
                    this.state = BALL_STATE.CARRIED;
                    this.carrier = colliders[i];
                    this.carrier.addBall(this);
                }
            }
        }

        /*var vmm = this;
        let ballVsBall = bump.hit(
            ball.shape, 
            [ball2.shape, ball3.shape], 
            true, false, false, 
            function(collision, otherball){
                console.log(collision);
                console.log(otherball);
              //`collision` tells you the side on player that the collision occurred on.
              //`platform` is the sprite from the `world.platforms` array
              //that the player is colliding with
    
              ball3.bounce(vmm.shape.rotation);

            }
          );*/


        if (this.state === BALL_STATE.MOVING) {
            this.cnt += 1;
            if (this.cnt % 10 == 0) { 
                this.tm += 1;
            }
            this.a = (this.p / this.tm) / this.m;
            if (this.a > 1.1) {
                //this.shape.x = this.shape.x + this.a * Math.cos(this.shape.rotation);
                //this.shape.y = this.shape.y + this.a * Math.sin(this.shape.rotation);
           
                console.log(this.dx);
                console.log(this.dy)
                this.shape.x = this.shape.x + (this.a*this.dx) * Math.cos(this.shape.rotation);
                this.shape.y = this.shape.y + (this.a*this.dy) * Math.sin(this.shape.rotation);
            } else {
                this.state = BALL_STATE.IDLE;
                this.cnt = 1;
                this.tm = 1;
                this.a = (this.p / this.tm);// / this.m;
                console.log("IDLE");
            }
        }


        bump.hit(
            this.shape,
            this.setupcolliders, 
            false, false, false, this.bounceOff);

    };

    this.fire = () => {
        console.log("bye");
        this.state = BALL_STATE.MOVING;
        this.shape.anchor.set(0.5, 0.5);
        this.shape.x = this.shape.x + 50 * Math.cos(this.shape.rotation);
        this.shape.y = this.shape.y + 50 * Math.sin(this.shape.rotation);
    };

    this.bounce = () => {
        this.shape.rotation = rot;
        this.state = BALL_STATE.MOVING;
    };

    this.bounceOff = function(collision, otherball) {
       console.log(collision);
        console.log(otherball);
       this.dx = -1;
   
    };
}

/***************** */


var set1,set2,set3;

function setTiling() {
    var tilingSprite = new PIXI.TilingSprite(
        PIXI.loader.resources["./assets/sprites/tileSand1.png"].texture,
        app.renderer.width,
        app.renderer.height
    );

    player = new Player(app.screen.width / 2, app.screen.height / 2);
    space.press = this.player.setPressEvent;
    ball = new Ball(app.screen.width / 3, app.screen.height / 3, tex_ballPurple);
    ball2 = new Ball(app.screen.width - 200, app.screen.height - 200, tex_ballOrange);
    ball3 = new Ball(app.screen.width - 500, app.screen.height - 500, tex_ballRed);
    ball.setCollider([ball2.shape, ball3.shape]);
    ball2.setCollider([ball.shape, ball3.shape]);
    ball3.setCollider([ball.shape, ball2.shape]);

    gameScene.addChild(tilingSprite);
    gameScene.addChild(player.player);
    gameScene.addChild(player.shotspr);
    gameScene.addChild(ball.shape);
    gameScene.addChild(ball2.shape);
    gameScene.addChild(ball3.shape);

    app.stage.addChild(gameScene);
        
    gameState = play;
    app.ticker.add(delta => gameLoop(delta));
}


function gameLoop(delta) {
    gameState(delta);
}

function play(delta) {

    player.checkMovement(delta);
    ball.ballStep([player], delta);
    ball2.ballStep([player], delta);
    ball3.ballStep([player], delta);
}