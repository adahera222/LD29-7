deathSounds = [
    document.getElementById("death0"),
    document.getElementById("death1"),
    document.getElementById("death2"),
];

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
    Rect.call(this, pos, size, colour ? colour : "#888888");
    PhysicsObject.call(this, this, true);
}

function CirclePlatform(centre, radius, colour){
    Circle.call(this, centre, radius, colour ? colour : "#888888");
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

function Bullet(pos, dir, owner, colour, radius){
    
    var radius = radius ? radius : 1.2;
    var colour = colour ? colour : "#333333";
    
    Particle.call(this, pos, radius, colour);
    
    this.speed = 400;
    this.dir = dir;
    this.owner = owner;
    this.mask = this.owner;
    
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
                var amount = this.maxDamageAmount * (Math.random() / 2 + .5);
                
                hit[i].damage(amount, this.centre.copy());
                
                if ("score" in this.owner){
                    this.owner.score += Math.floor(amount);
                }
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

function FloatingText(pos, text, speed, colour, font){
    this.pos    = pos;
    this.text   = text;
    this.speed  = speed;
    this.colour = colour;
    this.font   = font ? font : "20px Snoot";
    
    this.dead = false;
    
    this.fontSize = parseInt(ctx.font.slice(0, 3), 10);
    
    Game.misc.push(this);
    
    this.draw = function(){
        if (this.dead){
            return;
        }
        
        ctx.font = this.font;
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
    
    this.healthAsRatio = function(){
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
        
        if ("hurtSounds" in this && this.health > 0){
            this.hurtSounds[Math.floor(Math.random() * this.hurtSounds.length)].play();
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
    
    this.hurtSounds = [
        document.getElementById("hurt0"),
        document.getElementById("hurt1"),
        document.getElementById("hurt2"),
        document.getElementById("hurt3"),
        document.getElementById("hurt4"),
    ];
    
    this.jumpSounds = [
        document.getElementById("jump"),
    ];
    
    this.shootSounds = [
        document.getElementById("shoot0"),
        document.getElementById("shoot1"),
    ];
    
    Rect.call(this, pos, size, "#FF0000");
    PhysicsObject.call(this, this);
    HealthObject.call(this, 100);
    
    this.jumpSpeed = 240;
    
    this.moveSpeed = 200;
    
    this.score = 0;
    
    this.sprite = new Sprite(this.left_images, this.right_images, .1);
    this.right_arm = document.getElementById("right_arm");
    this.left_arm = document.getElementById("left_arm");
    
    this.bulletCooldown = .2;
    this.timeUntilBullet = 0;
    
    healthRectSize = [200, 20];
    
    this.redHealthRect = new Rect([(canvas.width - healthRectSize[0]) / 2, (canvas.height - healthRectSize[1]) / 8], healthRectSize, "#FF0000")
    this.greenHealthRect = this.redHealthRect.copy();
    this.greenHealthRect.colour = "#00FF00";
    
    this.onCollisionX = function(hit){
        for (i in hit){
            if (hit[i] instanceof Monster){
                this.die();
            }
        }
    }
    
    this.update = function(){
        if (this.dead){
            return;
        }
        
        this.checkDeathDepth();
        
        this.sprite.update();
        this.handleKey();
        
        this.greenHealthRect.size[0] = this.redHealthRect.size[0] * this.healthAsRatio();
        
        this.timeUntilBullet -= deltaTime;
    };
    
    this.jump = function(){
        if (! this.isGrounded) return;
        
        while (this.sprite.i != 1){
            this.sprite.animate(true);
        }
        this.velocity[1] = -this.jumpSpeed;
        
        this.jumpSounds[Math.floor(Math.random() * this.jumpSounds.length)].play();
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
        
        this.shootSounds[Math.floor(Math.random() * this.shootSounds.length)].play();
        
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
    
    this.checkDeathDepth = function(){
        if (Game.screenToWorld(this.pos)[1] > Game.deathDepth){
            this.die();
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
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "72px Snoot"
        ctx.fillText(this.score, 0, 48);
        
        this.redHealthRect.draw(ctx);
        this.greenHealthRect.draw(ctx);
        this.redHealthRect.draw(ctx, 1, "#000000");
    }
    
    this.die = function(){
        this.dead = true;
        this.physicsEnabled = false;
        
        bloodParticlesPerArea = 50;
        
        for (var i=0; i < (this.size[0] * this.size[1]) / bloodParticlesPerArea; i++){
            new Blood([this.pos[0] + this.size[0] * Math.random(), this.pos[1] + this.size[1] * Math.random()]);
        }
        
        deathSounds[Math.floor(Math.random() * deathSounds.length)].play();
        window.setTimeout(Game.gameOver, 3000);
    }
}

function Enemy(pos, size, colour, health){
    Rect.call(this, pos, size, colour ? colour : "#000000");
    PhysicsObject.call(this, this);
    HealthObject.call(this, health ? health : 100);
    
    this.bloodParticlesPerArea = 50;
    
    this.update = function(player){
        
    }
    
    this.checkDeathDepth = function(){
        if (Game.screenToWorld(this.pos)[1] > Game.deathDepth){
            this.die();
        }
    }
    
    this.die = function(){
        this.dead = true;
        
        for (var i=0; i < clamp((this.size[0] * this.size[1]) / this.bloodParticlesPerArea, 1, 200); i++){
            new Blood([this.pos[0] + this.size[0] * Math.random(), this.pos[1] + this.size[1] * Math.random()]);
        }
        
        this.physicsEnabled = false;
        
        if (SCREENRECT.collideRect(this)){
            deathSounds[Math.floor(Math.random() * deathSounds.length)].play();
        }
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
    
    this.damageCooldown = .2;
    this.timeUntilDamage = 0;
    
    this.onCollisionX = function(hit){
        if (this.timeUntilDamage > 0){
            return;
        }
        
        for (i in hit){
            if ("damage" in hit[i]){
                hit[i].damage(1, this.centre);
                this.timeUntilDamage = this.damageCooldown;
            }
        }
    }
    
    this.update = function(player){
        if (this.dead){
            return;
        }
        
        this.timeUntilDamage -= deltaTime;
        
        this.checkDeathDepth();
        
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
    Enemy.call(this, pos, Runner.size, "#0000DD", 100);
    
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
            
            if ("damage" in hit[i]){
                hit[i].damage(this.jumpDamage * (.5 + Math.random() / 2), hit[i].pos.copy());
            }
        }
    }
    
    this.update = function(player){
        if (this.dead){
            return;
        }
        
        this.checkDeathDepth();
        
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

Monster.size = [250, 550];
function Monster(pos){
    Enemy.call(this, pos, Monster.size, "#0000DD", 1000);
    this.kinematic = true;
    
    this.right_images = [
        document.getElementById("monster0"),
        document.getElementById("monster1"),
        document.getElementById("monster2"),
        document.getElementById("monster3"),
        document.getElementById("monster4"),
        document.getElementById("monster5"),
    ];
    
    this.shootSounds = [
        document.getElementById("monster_shoot0"),
        document.getElementById("monster_shoot1"),
    ];
    
    this.eyePos = new Vector2(220, 110);
    
    this.sprite = new Sprite(this.right_images, [], 0.25, true);
    
    this.fireCooldown = .8;
    this.timeUntilFire = 0;
    
    this.onCollisionX = function(hit){
        
        for (i in hit){
            if ("die" in hit[i]){
                hit[i].die();
            }
        }
    }
    
    this.fire = function(){
        if (this.timeUntilFire > 0){
            return;
        }
        this.timeUntilFire = this.fireCooldown;
        
        firePos = this.pos.copy().add(this.eyePos);
        
        if (! SCREENRECT.collidePoint(firePos)){
            return;
        }
        
        angle = firePos.angleTo(Game.player.centre);
        angle[0] *= -1;
        
        angle.rotate((Math.PI / 6) * random.binomial());
        
        this.shootSounds[Math.floor(Math.random() * this.shootSounds.length)].play();
        
        return new Bullet(firePos, angle, this, "#FF0000", 5);
    }
    
    this.update = function(player){
        if (this.dead){
            return;
        }
        
        this.fire()
        this.sprite.update();
        
        this.timeUntilFire -= deltaTime;
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
    
    music : document.getElementById("music"),
    
    totalDelta : new Vector2(0, 0),
    
    platforms : [
                 new Platform([0, 500], [800, 600]),
                 
                 new Platform([1000, 500], [80, 60]),
                 new Platform([1000, 660], [380, 300]),
                 new Platform([1200, 400], [200, 30]),
                 new Platform([1200, 570], [300, 22]),
                 new Platform([1600, 650], [400, 20]),
                 new Platform([2200, 750], [50, 50]),
                 
                 new Platform([-500, 390], [400, 50]),
                 new Platform([-750, 300], [140, 20]),
                 new Platform([-1600, 400], [600, 30]),
                 new Platform([-2150, 400], [200, 30]),
                 new Platform([-2100, 700], [700, 400]),
                 new CirclePlatform([-1000, 700], 80),
                 new CirclePlatform([-600, 750], 80),
                 new CirclePlatform([-250, 650], 80),
                 new Platform([-2500, 550], [250, 700]),
                ],
                 
    enemies : [new Monster([-2850, 275])],
               
    particles : [],
    
    misc : [],
    
    deathDepth : 2000,
    
    spawnEnemyChance : 1/3, //Per second.
    
    enemyTypes : [Runner, Bat],
    
    timeBetweenSpawnEnemy : 1,
    timeUntilSpawnEnemy   : 0,
    
    started : false,
    dt_threshold : .2,
        
    update : function(){
        if (! this.started){
            if (Key.isDown(Key.ENTER)){
                this.started = true;
                
                this.music.play();
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
        
        this.totalDelta.add(delta);
        
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
            do{
                platform = this.platforms[Math.floor(Math.random() * this.platforms.length)];
            }
            while(platform instanceof CirclePlatform);
            
            x = platform.pos[0] + platform.size[0] * Math.random();
            y = platform.pos[1] - enemyClass.size[1] * clamp(5 * Math.random(), 1, 5);
        }
        while (SCREENRECT.collidePoint([x, y]) || PhysicsManager.isColliding(new Rect([x, y], enemyClass.size)).length > 0);
        
        this.enemies.push(new enemyClass([x, y]));
    },

    render : function(){
        if (! this.started){
            this.runTitle();
            
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
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
        
        this.player.draw();
    },
    
    screenToWorld : function(vector){
        return vector.copy().sub(this.totalDelta);
    },
    
    runTitle : function(){
        ctx.drawImage(title, 0, 0);
    },
    
    gameOver : function(){
        location.reload();
    },
}

function update(){
    Game.update();
}

function render(){
    Game.render();
}

if (typeof Game.music.loop == 'boolean'){
    Game.music.loop = true;
}
else{
    Game.music.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);
}

var updateIntervalID = window.setInterval(update, 5);
var RenderIntervalID = window.setInterval(render, 1000 / FPS);
