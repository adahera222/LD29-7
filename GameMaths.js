var UP    = new Vector2(0, -1);
var DOWN  = new Vector2(0,  1);
var LEFT  = new Vector2(-1, 0);
var RIGHT = new Vector2(1,  0);
var ZERO  = new Vector2(0,  0);

function degrees(rads){
	return rads * (180 / Math.PI);
}

function radians(degs){
	return degs * (Math.PI / 180);
}

function fromRadians(rads){
	return new Vector2(-Math.cos(rads), Math.sin(rads));
}

function toRadians(vector){
    return Math.atan2(vector[0], vector[1]);
}
    
function fromDegrees(degs){
    return fromRadians(radians(degs));
}
    
function toDegrees(vector){
    return degrees(toRadians(vector));
}

function clamp(i, min, max){
	return Math.min(Math.max(i, min), max);
}

function Vector2(x, y){
	Array.call(this);
	
	this[0] = x;
	this[1] = y;
	
	this.__defineGetter__("x", function(){
        return this[0];
    });
   
    this.__defineSetter__("x", function(val){
        this[0] = val;
    });
    
    this.__defineGetter__("y", function(){
        return this[1];
    });
   
    this.__defineSetter__("y", function(val){
        this[1] = val;
    });
    
    this.add = function(other){
		this[0] += other[0];
		this[1] += other[1];
        
        return this;
	};
	
	this.sub = function(other){
		this[0] -= other[0];
		this[1] -= other[1];
        
        return this;
	};
	
	this.mul = function(other){
		if (typeof other === "number"){
			this[0] *= other;
			this[1] *= other;
		}
		else{
			this[0] *= other[0];
			this[1] *= other[1];
		}
        
        return this;
	};
	
	this.div = function(other){
		if (typeof other === "number"){
			this[0] /= other;
			this[1] /= other;
		}
		else{
			this[0] /= other[0];
			this[1] /= other[1];
		}
        
        return this;
	};
	
	this.equals = function(other){
		return this[0] == other[0] && this[1] == other[1];
	}
	
	this.magnitude = function(){
		return Math.sqrt(this.magnitudeSquared());
	};
	
	this.magnitudeSquared = function(){
		return this[0] * this[0] + this[1] * this[1];
	};
	
	this.normalise = function(){
		var m = this.magnitude();
		
		if (m == 0){
			return this;
		}
		
		this[0] /= m;
		this[1] /= m;
        
        return this;
	};
	
	this.angleTo = function(other){
		var dx = other[0] - this[0];
		var dy = other[1] - this[1];
	
		return fromRadians(Math.atan2(dy, dx) % (2 * Math.PI));
	};
	
	this.distanceTo = function(other){
		var dx = other[0] - this[0];
		var dy = other[1] - this[1];
	
		return Math.sqrt(Math.abs(dx*dx + dy*dy));
	};
	
	this.dot = function(other){
		return (this[0] * other[0] + this[1] * other[1]);
	};
	
	this.cross = function(other){
		return (this[0] * other[1] - this[1] * other[0]);
	};
	
	this.scale = function(magnitude){
		var ratio = magnitude / this.magnitude();
		
		this.mul(ratio);
        return this;
	};
	
	this.lerp = function(other, t){
		this[0] += other[0] * t;
		this[1] += other[1] * t;
        return this;
	};
	
	this.rotate = function(rads){
		var sin = Math.sin(rads);
		var cos = Math.cos(rads);
		
		var x = this[0];
		
		this[0] = x * cos - this[1] * sin;
		this[1] = x * sin + this[1] * cos;
        
        return this;
	};
	
	this.copy = function(){
		return new Vector2(this[0], this[1]);
	};
}

function Shape(){
	this.collide = function(other){
		if (other.type == "Circle")
			return this.collideCircle(other);
		else if (other.type == "Rect")
			return this.collideRect(other);
		else
			return this.collidePoint(other);
	}
}

function Rect(pos, size, colour){
	
	Shape.call(this);
	
	this.pos =  new Vector2(pos[0], pos[1]);
	this.size = new Vector2(size[0], size[1]);
	this.colour = colour;
    this.type = "Rect";
    
    this.__defineGetter__("centre", function(){
        return new Vector2(this.pos[0] + size[0] / 2, this.pos[0] + size[1] / 2);;
    });
	
	this.collideRect = function(other){
		if (this.pos[0] > (other.pos[0] + other.size[0]) || (this.pos[0] + this.size[0]) < other.pos[0]) return false;
		if (this.pos[1] > (other.pos[1] + other.size[1]) || (this.pos[1] + this.size[1]) < other.pos[1]) return false;
		return true;
	};
	
	this.collideCircle = function(circle){
		return circle.collideRect(this);
	};
	
	this.collidePoint = function(point){
		return (this.pos[0] < point[0] && point[0] < (this.pos[0] + this.size[0]) &&
			     this.pos[1] < point[1] && point[1] < (this.pos[1] + this.size[1]));
	};
	
	this.copy = function(){
		return new Rect(this.pos, this.size);
	};
    
    this.translate = function(vector){
        this.pos.add(vector);
    }
	
	this.draw = function(ctx, width, colour){
		if (! width){
			ctx.fillStyle = colour ? colour : this.colour;
			ctx.fillRect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
		}
		else{
			ctx.strokeStyle = colour ? colour : this.colour;
			ctx.lineWidth = width;
			ctx.strokeRect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
		}
	};
}

function Circle(centre, radius, colour){
	
	Shape.call(this);
	
	this.centre = new Vector2(centre[0], centre[1]);
	this.radius = radius;
	this.colour = colour;
    this.type = "Circle";
	
	this.collideRect = function(rect){
		// Find the closest point to the circle within the rectangle
        var closestX = clamp(this.centre[0], rect.pos[0], rect.pos[0] + rect.size[0]);
        var closestY = clamp(this.centre[1], rect.pos[1], rect.pos[1] + rect.size[1]);

        // Calculate the distance between the circle's center and this closest point
        var distanceX = this.centre[0] - closestX;
        var distanceY = this.centre[1] - closestY;
        
        // If the distance is less than the circle's radius, an intersection occurs
        var distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
        return distanceSquared < (this.radius * this.radius);
	};
	
	this.collideCircle = function(other){
		var dx = (other.centre[0] - this.centre[0]);
		var dy = (other.centre[1] - this.centre[1]);
		var totalRadius = (self.radius + other.radius);
		
		return (dx * dx + dy * dy < totalRadius * totalRadius);
	};
	
	this.collidePoint = function(point){
		return self.centre.distanceTo(point) < self.radius;
	};
	
	this.copy = function(){
		return new Circle(this.centre, this.radius);
	};
    
    this.translate = function(vector){
        this.centre.add(vector);
    };
	
	this.draw = function(ctx, width, colour){
		ctx.beginPath();
		ctx.arc(this.centre[0], this.centre[1], this.radius, 0, 2 * Math.PI);
		
		if (! width){
			ctx.fillStyle = colour ? colour : this.colour;
			ctx.fill();
		}
		else{
			ctx.strokeStyle = colour ? colour : this.colour;
			ctx.lineWidth = width;
			ctx.stroke();
		}
	};
}

var random = {
    binomial : function(){
        return Math.random() - Math.random();
    }
}
