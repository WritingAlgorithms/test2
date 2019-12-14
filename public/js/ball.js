function Ball(m, v, spr) {
    this.sprBall = spr;
    this.moving = false;
    this.a = 0;
    this.m = m;
    this.v = v;
    this.p = this.m * this.v;
    console.log(this.a);
    console.log(this.m);
    console.log(this.v);
    console.log(this.p);

    this.setAcceleration = function(t) {
        this.a = (this.p / t) / this.m;
        console.log(this.a);
    };

    this.move = function() {
        this.sprBall.x = this.sprBall.x + this.a * Math.cos(this.sprBall.rotation);
        this.sprBall.y = this.sprBall.y + this.a * Math.sin(this.sprBall.rotation);
        console.log(this.sprBall.x);
        console.log(this.sprBall.y);
    };

    this.applyForce = function(rot) {
        this.sprBall.rotation = rot;
        this.moving = true;
        this.a = this.setAcceleration(1);
    };
}