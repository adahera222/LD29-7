var PhysicsManager = {
    g : new Vector2(0, 9.81),
    pixelsPerMetre : 25,
    
    objects : [],
    
    addObject : function(object){
        this.objects.push(object);
    },
    
    isColliding : function(collider, ignoreObject){
        var hit = [];
        
        for (var i=0; i < this.objects.length; i++){
            if (ignoreObject === this.objects[i]){
                continue;
            }
            
            if (collider.collide(this.objects[i].collider)){
                hit.push(this.objects[i]);
            }
        }
                
        return hit;
    },
    
    update : function(){
        var dG = this.g.copy()
        dG.mul(deltaTime * this.pixelsPerMetre);
        
        for (i in this.objects){
            this.objects[i].physicsUpdate();
            this.objects[i].velocity.add(dG);
        }
    },
    
    scroll : function(vector){
        for (i in this.objects){
            this.objects[i].collider.translate(vector);
        }
    }
}

function PhysicsObject(collider, kinematic){
    this.velocity = new Vector2(0, 0);
    this.collider = collider;
    
    this.kinematic  = kinematic;
    this.isGrounded = false;
    
    PhysicsManager.addObject(this);
    
    this.checkMove = function(){
        hit = [[], []];
        
        testX = this.collider.copy();
        testY = this.collider.copy();
        
        this.physicsMoveX(testX);
        this.physicsMoveY(testY);
        
        hit[0] = PhysicsManager.isColliding(testX, this);
        hit[1] = PhysicsManager.isColliding(testY, this);
        
        return hit;
    };
    
    this.physicsMoveX = function(collider){
        var collider = collider ? collider : this.collider;
        collider.translate(new Vector2(this.velocity[0] * deltaTime, 0));
    }
    
    this.physicsMoveY = function(collider){
        var collider = collider ? collider : this.collider;
        collider.translate(new Vector2(0, this.velocity[1] * deltaTime));
    }
    
    this.physicsUpdate = function(){
        if (this.kinematic){
            return;
        }
        
        var hit = this.checkMove();
        
        if (hit[0].length == 0){
            this.physicsMoveX();
        }
        else{
            this.velocity[0] = 0;
        }
        
        if (hit[1].length == 0){
            this.physicsMoveY();
            this.isGrounded = false;
        }
        else{
            this.velocity[1] = 0;
            
            for (var i=0; i < hit[1].length; i++){
                if (hit[1][i].collider.pos[1] > this.collider.pos[1]){
                    this.isGrounded = true;
                }
            }
        }
    }
}

//Look at all those close-brackets. Yes, the only comment is this useless.

function Platform(pos, size, colour){
    Rect.call(this, pos, size, colour ? colour : "#000000");
    PhysicsObject.call(this, this, true);
}

function CirclePlatform(centre, radius, colour){
    Circle.call(this, centre, radius, colour ? colour : "#000000");
    PhysicsObject.call(this, this, true);
}

function Particle(pos, radius, colour){
    Circle.call(this, pos, radius, colour);
    Game.particles.push(this);
    
    this.mask = null;
    this.dead = false;
    
    this.update = function(){
    }
    
    this.onCollision = function(hit){
        
    }
    
    this.checkDestroy = function(){
        if (this.dead){
            return;
        }
        
        var hit = PhysicsManager.isColliding(this);
        
        if (hit.length > 0 && ! (hit.length == 1 && hit[0] == this.mask)){
            this.onCollision(hit);
            this.die();
        }
        
        if (! this.collideRect(SCREENRECT)){
            this.die();
        }
    }
    
    this.die = function(){
        this.dead = true;
    }
}

function Bullet(pos, dir, owner){
    var radius = 1.2;
    var colour = "#333333";
    
    Particle.call(this, pos, radius, colour);
    
    this.speed = 400;
    this.dir = dir;
    this.mask = owner;
    
    this.update = function(){
        if (this.dead){
            return;
        }
        
        this.translate(this.dir.copy().mul(this.speed * deltaTime));
    }
    
    this.onCollision(hit)
}

function Player(pos, size){
    
    this.right_images = [
        document.getElementById("rick0"),
        document.getElementById("rick1"),
        document.getElementById("rick2"),
    ];
    this.left_images = [
        document.getElementById("rick3"),
        document.getElementById("rick4"),
        document.getElementById("rick5"),
    ];
    
    Rect.call(this, pos, size, "#FF0000");
    PhysicsObject.call(this, this);
    
    this.jumpSpeed = 240;
    
    this.moveSpeed = 200;
    
    this.sprite = new Sprite(this.left_images, this.right_images, .1);
    this.right_arm = document.getElementById("right_arm");
    this.left_arm = document.getElementById("left_arm");
    
    this.update = function(){
        this.sprite.update();
        this.handleKey();
    };
    
    this.jump = function(){
        if (! this.isGrounded) return;
        
        while (this.sprite.i != 1){
            this.sprite.animate(true);
        }
        this.velocity[1] = -this.jumpSpeed;
    }
    
    this.fire = function(){
        var angle = this.collider.centre.angleTo(mousePos);
        angle[0] = Math.abs(angle[0]) * this.sprite.facing;
        
        return new Bullet(this.collider.centre, angle, this);
    }
    
    this.handleKey = function(){
        if (Key.isDown(Key.LEFT) || Key.isDown(Key.A)){
            this.velocity[0] = this.moveSpeed * -1;
            this.sprite.animating = this.isGrounded;
            this.sprite.facing = facings.LEFT;
        }
        else if(Key.isDown(Key.RIGHT) || Key.isDown(Key.D)){
            this.velocity[0] = this.moveSpeed;
            this.sprite.animating = this.isGrounded;
            this.sprite.facing = facings.RIGHT;
        }
        else{
            this.velocity[0] = 0;
            this.sprite.animating = false;
        }
        
        if (Key.isDown(Key.SPACE)){
            this.jump();
        }
    }
    
    this.draw = function(){
        var arm;
        if (this.sprite.facing == facings.LEFT){
            arm = this.left_arm;
        }
        else{
            arm = this.right_arm;
        }
                
        var angle = this.collider.centre.angleTo(mousePos);
        
        
        var armPos = new Vector2(this.collider.centre[0], this.collider.centre[1]);
        var armOffset = new Vector2(arm.width / 2, arm.height / 2)
        
        var rotation = toRadians(angle)
        rotation = Math.abs(rotation) * this.sprite.facing * -1;
        
        armOffset.rotate(rotation);
        armPos.add(armOffset);
        
        rotation = toRadians(angle.mul(-1));
        rotation = Math.abs(rotation) * this.sprite.facing;
        
        drawRotatedImage(arm, armPos, rotation);
        
        this.sprite.draw(ctx, this.pos);
    }
}

function Enemy(pos, size, colour){
    Rect.call(this, pos, size, colour ? colour : "#000000");
    PhysicsObject.call(this, this);
    
    this.update = function(player){
        
    }
}

function Bat(pos){
    var size = [20, 15];
    Enemy.call(this, pos, size);
    
    this.timeBetweenDirCalc = .3;
    this.timeUntilDirCalc   =  0;
    
    this.left_images = [
        document.getElementById("bat0"),
        document.getElementById("bat1"),
    ]
    this.right_images = [
        document.getElementById("bat2"),
        document.getElementById("bat3"),
    ]
    
    this.sprite = new Sprite(this.left_images, this.right_images, 0.1);
    this.speed = 200;
    
    this.update = function(player){
        this.sprite.update();
        
        this.timeUntilDirCalc -= deltaTime;
        
        if (this.timeUntilDirCalc <= 0){
            this.velocity = this.calcDirection(player).mul(this.speed);
            this.timeUntilDirCalc = this.timeBetweenDirCalc;
        }
    }
    
    this.calcDirection = function(player){
        var dir = this.pos.angleTo(player.collider.pos).mul(this.speed);
        dir[0] *= -1;
        dir.rotate(random.binomial() * Math.PI * (3/4)).normalise();
        
        if (dir[1] < 0){
            this.sprite.facing = facings.LEFT;
        }
        else{
            this.sprite.facing = facings.RIGHT;
        }
        
        return dir;
    }
    
    this.draw = function(){
        this.sprite.draw(ctx, this.pos);
    }
}

function onMouseDown(){
    Game.player.fire();
}

window.onmousedown = onMouseDown;

var playerSize = [20, 50];

var Game = {
    player : new Player([(canvas.width - playerSize[0]) / 2, (canvas.height - playerSize[1]) / 2], playerSize),
    
    platforms : [new Platform([0, 500], [800, 600]),
                 new Platform([1000, 500], [80, 60]),
                 new Platform([1200, 400], [200, 30]),
                 new Platform([1600, 650], [400, 20]),
                 new Platform([2200, 750], [50, 50]),
                 
                 new Platform([-500, 370], [400, 50]),
                 new Platform([-700, 300], [140, 20]),
                 new Platform([-1600, 400], [600, 30]),
                 new Platform([-1800, 370], [200, 50]),
                 new Platform([-2300, 400], [200, 30]),
                 new Platform([-2100, 700], [700, 40]),
                 new Platform([-2500, 550], [300, 700]),],
                 
    enemies : [new Bat([0, 0]), new Bat([100, 100]), new Bat([100, 200]), new Bat([200, 100]),
               new Bat([300, 200]), new Bat([200, 300]), new Bat([300, 300]), new Bat([200, 200]),],
               
    particles : [],
    
    dt_threshold : .2,
    
    deads : true,

    update : function(){        
        updateDeltaTime();
        
        if (this.deads){
            for (var i=0; i < 100; i++){
                var b = new Bullet([0, 0], [0, 0]);
                b.die();
            }
        }
        
        if (deltaTime > this.dt_threshold){
            return;
        }
        
        var playerPos = this.player.collider.pos.copy();
        
        this.player.update();
        
        for (i in this.enemies){
            this.enemies[i].update(this.player);
        }
        
        for (i in this.particles){
            this.particles[i].update();
            this.particles[i].checkDestroy();
        }
        
        PhysicsManager.update();
        
        var delta = this.player.collider.pos.copy().sub(playerPos);
        
        PhysicsManager.scroll(delta.mul(-1));
    },

    render : function(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.player.draw(ctx);
        
        for (i in this.platforms){
            this.platforms[i].draw(ctx);
        }
        
        for (i in this.enemies){
            this.enemies[i].draw(ctx);
        }
        
        for (i in this.particles){
            if (this.particles[i].dead){
                continue;
            }
            
            this.particles[i].draw(ctx);
        }
        
        ctx.fillText(Math.floor(1 / deltaTime), 0, 32)
    },
}

function update(){
    Game.update();
}

function render(){
    Game.render();
}

var updateIntervalID = window.setInterval(update, 5);
var RenderIntervalID = window.setInterval(render, 1000 / FPS);
