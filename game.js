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

function Player(pos, size){
    
    this.images = [
        document.getElementById("rick0"),
        document.getElementById("rick1"),
        document.getElementById("rick2"),
    ];
    
    console.log(this.images);
    
    Rect.call(this, pos, size, "#FF0000");
    PhysicsObject.call(this, this);
    
    this.jumpSpeed = 300;
    
    this.moveSpeed = 200;
    
    this.sprite = new Sprite(this.images, 100);
    
    this.update = function(){
        this.handleKey();
    };
    
    this.jump = function(){
        if (! this.isGrounded) return;
        
        this.velocity[1] = -this.jumpSpeed;
    }
    
    this.handleKey = function(){
        if (Key.isDown(Key.LEFT) || Key.isDown(Key.A)){
            this.velocity[0] = this.moveSpeed * -1;
        }
        else if(Key.isDown(Key.RIGHT) || Key.isDown(Key.D)){
            this.velocity[0] = this.moveSpeed;
        }
        else{
            this.velocity[0] = 0;
        }
        
        if (Key.isDown(Key.SPACE)){
            this.jump();
        }
    }
    
    this.draw = function(){
        this.sprite.draw(ctx, this.pos);
    }
}

var playerSize = [20, 50];

var Game = {
    player : new Player([(canvas.width - playerSize[0]) / 2, (canvas.height - playerSize[1]) / 2], playerSize),
    
    platforms : [new Platform([0, 500], [800, 600])],

    update : function(){
        updateDeltaTime();
        
        this.player.update();
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
