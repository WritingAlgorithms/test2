function Player(input_x, input_y, input_color) {
    this.container = new PIXI.Container();
    this.spriteBody = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tankBody_" + input_color + ".png"].texture);
    this.spriteHead = new PIXI.Sprite(PIXI.loader.resources["./assets/sprites/tank_" + input_color + ".png"].texture);
    this.spriteBody.anchor.set(0.5, 0.5);
    this.spriteHead.anchor.set(0.5, 0.5);
    this.spriteBody.x = input_x;
    this.spriteBody.y = input_y;
    this.spriteHead.x = input_x;
    this.spriteHead.y = input_y;
    this.spriteHead.scale.x = 0.8;
    this.spriteHead.scale.y = 0.8;

    this.init = function() {
        this.container.addChild(this.spriteBody);
        this.container.addChild(this.spriteHead);
    };
}