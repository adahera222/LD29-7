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
            if (ignoreObject === this.objects[i] || ! this.objects[i].physicsEnabled){
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
        
        for (var i=0; i < this.objects.length; i++){
            if (! this.objects[i].physicsEnabled){
                continue;
            }
            
            this.objects[i].physicsUpdate();
            
            if ("fire" in this){
                console.log(dG);
            }
            
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
    this.physicsEnabled = true;
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
    
    this.onCollisionX = function(){
        
    }
    
    this.onCollisionY = function(){
        
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
            this.onCollisionX(hit[0]);
        }
        
        if (hit[1].length == 0){
            this.physicsMoveY();
            this.isGrounded = false;
        }
        else{
            this.velocity[1] = 0.001;
            
            for (var i=0; i < hit[1].length; i++){
                if (hit[1][i].collider.pos[1] > this.collider.pos[1]){
                    this.isGrounded = true;
                }
            }
            
            this.onCollisionY(hit[1]);
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
    
    this.maxDamageAmount = 40;
    
    this.update = function(){
        if (this.dead){
            return;
        }
        
        this.translate(this.dir.copy().mul(this.speed * deltaTime));
    }
    
    this.onCollision = function(hit){
        for (i in hit){
            if ("damage" in hit[i] && hit[i] != this.mask){
                hit[i].damage(this.maxDamageAmount * (Math.random() / 2 + .5), this.centre.copy());
            }
        }
    }
}

function Blood(pos){
    radius = 1 + Math.random();
    colour = "#8A0707"
    
    this.velocity = new Vector2(0, 0);
    
    Particle.call(this, pos, radius, colour);
    
    this.update = function(){
        if (this.dead){
            return;
        }
        
        this.translate(this.velocity.copy().mul(deltaTime));
        this.velocity.add(PhysicsManager.g.copy().mul(deltaTime * PhysicsManager.pixelsPerMetre))
    }
}

function FloatingText(pos, text, speed, colour){
    this.pos      = pos;
    this.text     = text;
    this.speed    = speed;
    this.colour   = colour;
    
    this.dead = false;
    
    this.fontSize = parseInt(ctx.font.slice(0, 3), 10);
    
    Game.misc.push(this);
    
    this.draw = function(){
        if (this.dead){
            return;
        }
        
        ctx.fillStyle = this.colour;
        ctx.fillText(this.text, this.pos[0], this.pos[1]);
    }
    
    this.update = function(){
        if (this.dead){
            return;
        }
        
        this.pos[1] -= this.speed * deltaTime;
        
        if (this.pos[1] + this.fontSize < 0){
            this.die();
        }
    }
    
    this.die = function(){
        this.dead = true;
    }
}

function HealthObject(maxHealth){
    this.maxHealth = maxHealth;
    this.health = this.maxHealth;
    
    this.dead = false;
    
    this.heathAsRatio = function(){
        return this.health / this.maxHealth;
    }
    
    this.damage = function(amount, floatingTextPos){
        this.health -= amount;
        
        if (this.health <= 0){
            this.die();
        }
        if (floatingTextPos){
            new FloatingText(floatingTextPos, Math.floor(amount), 150, this == Game.player ? "#FF0000" : "#55BB00");
        }
    }
    
    this.die = function(){
        this.dead = true;
    }
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
    HealthObject.call(this, 100);
    
    this.jumpSpeed = 240;
    
    this.moveSpeed = 200;
    
    this.sprite = new Sprite(this.left_images, this.right_images, .1);
    this.right_arm = document.getElementById("right_arm");
    this.left_arm = document.getElementById("left_arm");
    
    this.bulletCooldown = .2;
    this.timeUntilBullet = 0;
    
    this.update = function(){
        if (this.dead){
            return;
        }
        
        this.sprite.update();
        this.handleKey();
        
        this.timeUntilBullet -= deltaTime;
    };
    
    this.jump = function(){
        if (! this.isGrounded) return;
        
        while (this.sprite.i != 1){
            this.sprite.animate(true);
        }
        this.velocity[1] = -this.jumpSpeed;
    }
    
    this.fire = function(){
        if (this.dead){
            return;
        }
        
        if (this.timeUntilBullet > 0){
            return;
        }
        
        var angle = this.collider.centre.angleTo(mousePos);
        angle[0] = Math.abs(angle[0]) * this.sprite.facing;
        
        this.timeUntilBullet = this.bulletCooldown;
        
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
        if (this.dead){
            return;
        }
        
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
    
    this.die = function(){
        this.dead = true;
        this.physicsEnabled = false;
    }
}

function Enemy(pos, size, colour, health){
    Rect.call(this, pos, size, colour ? colour : "#000000");
    PhysicsObject.call(this, this);
    HealthObject.call(this, health ? health : 100);
    
    this.bloodParticlesPerArea = 50;
    
    this.update = function(player){
        
    }
    
    this.die = function(){
        this.dead = true;
        
        for (var i=0; i < (this.size[0] * this.size[1]) / this.bloodParticlesPerArea; i++){
            new Blood([this.pos[0] + this.size[0] * Math.random(), this.pos[1] + this.size[1] * Math.random()]);
        }
        
        this.physicsEnabled = false;
    }
}

Bat.size = [20, 15];
function Bat(pos){
    Enemy.call(this, pos, Bat.size, "#000000", 40);
    
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
    
    this.sprite = new Sprite(this.left_images, this.right_images, 0.08);
    this.speed = 200;
    
    this.update = function(player){
        if (this.dead){
            return;
        }
        
        this.sprite.update();
        
        this.timeUntilDirCalc -= deltaTime;
        
        if (this.timeUntilDirCalc <= 0){
            this.velocity = this.calcDirection(player).mul(this.speed);
            this.timeUntilDirCalc = this.timeBetweenDirCalc;
        }
    }
    
    this.calcDirection = function(player){
        var dir = this.pos.angleTo(player.centre);
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
        if (this.dead){
            return;
        }
        
        this.sprite.draw(ctx, this.pos);
    }
}

Runner.size = [20, 50];

function Runner(pos){
    Enemy.call(this, pos, Runner.size, "#0000DD", 80);
    
    this.timeBetweenDirCalc = .01;
    this.timeUntilDirCalc   =  0;
    
    this.right_images = [
        document.getElementById("runner0"),
        document.getElementById("runner1"),
    ]
    this.left_images = [
        document.getElementById("runner2"),
        document.getElementById("runner3"),
    ]
    
    this.sprite = new Sprite(this.left_images, this.right_images, 0.2);
    
    this.speed = 200;
    this.jumpSpeed = 240;
    
    this.jumpDamage = 20;
    this.jumpDistToPlayer = 200;
    
    this.currentPlatform = null;
    
    this.onCollisionY = function(hit){
        for (i in hit){
            if (hit[i].collider.centre[1] < this.centre[1]){
                continue;
            }
            
            if (hit[i] instanceof Platform){
                this.platform = hit[i];
            }
            
            if (hit[i] == Game.player){
                hit[i].damage(this.jumpDamage * (.5 + Math.random() / 2), hit[i].pos.copy());
            }
        }
    }
    
    this.update = function(player){
        if (this.dead){
            return;
        }
        
        this.sprite.update();
        
        this.timeUntilDirCalc -= deltaTime;
        
        if (this.timeUntilDirCalc <= 0){
            this.velocity[0] = this.calcDirection(player)[0] * this.speed;
            this.timeUntilDirCalc = this.timeBetweenDirCalc;
        }
    }
    
    this.jump = function(){
        if (! this.isGrounded) return;
        
        this.velocity[1] = -this.jumpSpeed;
    }
    
    this.calcDirection = function(player){
        var dir = this.centre.angleTo(player.centre);
        dir[0] *= -1;
        
        if (! this.platform){
            return dir;
        }
        
        var centre_x = this.centre[0] + this.velocity[0] * deltaTime;
        
        if (this.centre.distanceTo(Game.player.centre) < this.jumpDistToPlayer ||
            centre_x < this.platform.pos[0] || centre_x > (this.platform.pos[0] + this.platform.size[0])){
            this.jump();
        }
        
        if (dir[1] < 0){
            this.sprite.facing = facings.LEFT;
        }
        else{
            this.sprite.facing = facings.RIGHT;
        }
        
        return dir;
    }
    
    this.draw = function(){
        if (this.dead){
            return;
        }
        
        this.sprite.draw(ctx, this.pos);
    }
}

var title = document.getElementById("title");

function onMouseDown(){
    Game.player.fire();
}

window.onmousedown = onMouseDown;

var playerSize = [20, 50];

var Game = {
    player : new Player([(canvas.width - playerSize[0]) / 2, (canvas.height - playerSize[1]) / 2], playerSize),
    
    platforms : [
                 new Platform([0, 500], [800, 600]),
                 
                 new Platform([1000, 500], [80, 60]),
                 new Platform([1200, 400], [200, 30]),
                 new Platform([1600, 650], [400, 20]),
                 new Platform([2200, 750], [50, 50]),
                 
                 new Platform([-500, 390], [400, 50]),
                 new Platform([-700, 300], [140, 20]),
                 new Platform([-1600, 400], [600, 30]),
                 new Platform([-2300, 400], [200, 30]),
                 new Platform([-2100, 700], [700, 40]),
                 new Platform([-2500, 550], [300, 700]),
                ],
                 
    enemies : [],
               
    particles : [],
    
    misc : [],
    
    spawnEnemyChance : 1/4, //Per second.
    
    enemyTypes : [Runner, Bat],
    
    timeBetweenSpawnEnemy : 1,
    timeUntilSpawnEnemy   : 0,
    
    started : false,
    dt_threshold : .2,
    
    update : function(){
        if (! this.started){
            if (Key.isDown(Key.ENTER)){
                this.started = true;
            }
            
            return;
        }
        
        updateDeltaTime();
        
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
        
        for (i in this.misc){
            this.misc[i].update();
        }
        
        PhysicsManager.update();
        
        var delta = this.player.collider.pos.copy().sub(playerPos).mul(-1);
        
        PhysicsManager.scroll(delta);
        
        for (i in this.particles){
            this.particles[i].pos.add(delta);
        }
        
        for (i in this.misc){
            this.misc[i].pos.add(delta);
        }
        
        this.timeUntilSpawnEnemy -= deltaTime;
        
        if (this.timeUntilSpawnEnemy <= 0){
            if (Math.random() < this.spawnEnemyChance){
                this.spawnEnemy();
            }
            
            this.timeUntilSpawnEnemy = this.timeBetweenSpawnEnemy;
        }
    },
    
    spawnEnemy : function(){
        var platform, x, y
        enemyClass = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
        
        do{
            platform = this.platforms[Math.floor(Math.random() * this.platforms.length)];
            
            x = platform.pos[0] + platform.size[0] * Math.random();
            y = platform.pos[1] - enemyClass.size[1] * clamp(5 * Math.random(), 1, 5);
        }
        while (SCREENRECT.collidePoint([x, y]));
        
        this.enemies.push(new enemyClass([x, y]));
    },

    render : function(){
        if (! this.started){
            this.runTitle();
            
            return;
        }
        
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
        
        for (i in this.misc){
            this.misc[i].draw();
        }
        
        //ctx.fillText(Math.floor(1 / deltaTime), 0, 32)
    },
    
    runTitle : function(){
        ctx.drawImage(title, 0, 0);
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
