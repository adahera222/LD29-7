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
    this.isBlocked = false;
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
            this.isBlocked = false;
        }
        else{
            this.isBlocked = true;
            this.velocity[0] = 0;
        }
        
        if (hit[1].length == 0){
            this.physicsMoveY();
            this.isGrounded = false;
        }
        else{
            this.isGrounded = true;
            this.velocity[1] = 0;
        }
    }
}

function Platform(pos, size, colour){
    Rect.call(this, pos, size, colour ? colour : "#000000");
    PhysicsObject.call(this, this, true);
}

function CirclePlatform(centre, radius, colour){
    Circle.call(this, centre, radius, colour ? colour : "#000000");
    PhysicsObject.call(this, this, true);
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
    
    this.update = function(){
        this.sprite.update();
        this.handleKey();
    };
    
    this.jump = function(){
        if (! this.isGrounded) return;
        
        this.velocity[1] = -this.jumpSpeed;
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

var playerSize = [20, 50];

var Game = {
    player : new Player([(canvas.width - playerSize[0]) / 2, (canvas.height - playerSize[1]) / 2], playerSize),
    
    platforms : [new Platform([0, 500], [800, 600]),
                 new Platform([1000, 500], [80, 60]),
                 new Platform([1200, 400], [200, 30]),
                 new Platform([1600, 650], [400, 20]),
                 new Platform([2200, 750], [50, 50]),],
                 
    enemies : [new Bat([0, 0])],

    update : function(){
        updateDeltaTime();
        
        this.player.update();
        
        for (i in this.enemies){
            this.enemies[i].update(this.player);
        }
        
        PhysicsManager.update();
        
        var scroll = this.player.velocity.copy().mul(-deltaTime);
        scroll[0] *= ! this.player.isBlocked;
        scroll[1] *= ! this.player.isGrounded;
        PhysicsManager.scroll(scroll);
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
