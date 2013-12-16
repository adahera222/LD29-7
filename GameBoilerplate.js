var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.font = "20px Snoot";

var SCREENRECT = new Rect([0, 0], [canvas.width, canvas.height]);

var FPS = 60;

var d = new Date();
var startTime = d.getTime() / 1000;
var time;
var deltaTime;
var lastTime = startTime;
var timeElapsed;

function updateDeltaTime(){
	d = new Date();
	time = d.getTime() / 1000;
	deltaTime = time - lastTime;
	timeElapsed = time - startTime;
	lastTime = time;
}

var mousePos = new Vector2(0, 0);

function updateMousePos(event){
	event = event || window.event;
	if (event.offsetX){
		mousePos = new Vector2(event.offsetX, event.offsetY);
	}
	else if (event.layerX){
		mousePos = new Vector2(event.layerX, event.layerY);
	}
}

window.onmousemove = updateMousePos;

function drawRotatedImage(image, pos, angle){
	//This function shamelessly stolen from Seb Lee-Delisle of http://creativejs.com/
 
	// save the current co-ordinate system 
	// before we screw with it
	ctx.save(); 
 
	// move to the middle of where we want to draw our image
	ctx.translate(pos[0], pos[1]);
 
	// rotate around that point, converting our 
	// angle from degrees to radians 
	ctx.rotate(angle);
 
	// draw it up and to the left by half the width
	// and height of the image 
	ctx.drawImage(image, -(image.width/2), -(image.height/2));
 
	// and restore the co-ords to how they were when we began
	ctx.restore(); 
}

function getImageData(image){
	var canvasSave = ctx.getImageData(0, 0, canvas.width, canvas.height);
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(image, 0, 0);
	
	var imageData = ctx.getImageData(0, 0, image.width, image.height)
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	ctx.putImageData(canvasSave, 0, 0);
	
	return imageData;
}

var Key = {
	_pressed: {},
	
	ENTER : 13,
	SPACE : 32,

	LEFT  : 37,
	UP    : 38,
	RIGHT : 39,
	DOWN  : 40,
	
	W : 87,
	A : 65,
	S : 83,
	D : 68,

	isDown: function(keyCode) {
		return this._pressed[keyCode];
	},

    onKeydown: function(event) {
		this._pressed[event.keyCode] = true;
	},

	onKeyup: function(event) {
		delete this._pressed[event.keyCode];
	},
}

window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

var facings = {
    LEFT : -1,
    RIGHT : 1,
}

function Sprite(left_images, right_images, interval, switcher){
    this.left_images = left_images;
    this.right_images = right_images;
    this.interval = interval;
    this.timeUntilAnimate = this.interval;
    this.i = 0;
    this.animating = true;
    this.facing = facings.LEFT;
    
    this.switcher = switcher;
    this.direction = 1;
    
    this.image = this.facing == facings.LEFT ? this.left_images[this.i] : this.right_images[this.i];
    
    this.animate = function(override){
        this.image = this.facing == facings.LEFT ? this.left_images[this.i] : this.right_images[this.i];
        
        if (! this.animating && ! override){
            return;
        }
        
        this.i += 1 * this.direction;
        
        if (this.i >= (this.facing == facings.LEFT ? this.left_images : this.right_images).length || (this.i == 0 && this.direction == -1)){
            if (! this.switcher){
                this.i = 0;
            }
            else{
                this.direction *= -1;
                this.i += 1 * this.direction;
            }
        }
    }
    
    this.update = function(){        
        this.timeUntilAnimate -= deltaTime;
        
        if (this.timeUntilAnimate <= 0){
            this.animate();
            this.timeUntilAnimate = this.interval;
        }
    }
    
    this.draw = function(ctx, pos){
        ctx.drawImage(this.image, pos[0], pos[1]);
    }
    
    this.end = function(){
        window.endInterval(this.intervalID);
    }
}
