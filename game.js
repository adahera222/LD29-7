function fillAroundRect(rect, colour){
    ctx.fillStyle = colour ? colour : "#000000";
    
    ctx.fillRect(0, 0, canvas.width, rect.pos[1]);
    ctx.fillRect(0, 0, rect.pos[0], canvas.height);
    ctx.fillRect(rect.pos[0] + rect.size[0], 0, canvas.width, canvas.height);
    ctx.fillRect(0, rect.pos[1] + rect.size[1], canvas.width, canvas.height);
}

                       
hills = document.getElementById("hills");

var Sight = {
    size : [100, 100],
                     
    draw : function(dotColour){
        this.rect = new Rect([mousePos[0] - this.size[0] / 2,
                               mousePos[1] - this.size[1] / 2], 
                              this.size);
                                     
        fillAroundRect(this.rect);
        
        ctx.beginPath();
        ctx.fillStyle = dotColour ? dotColour : "#FF0000";
        ctx.arc(mousePos[0], mousePos[1], 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function update(){
    updateDeltaTime()
    cursorRect = new Rect([mousePos[0] - cursorRectSize[0] / 2,
                            mousePos[1] - cursorRectSize[1] / 2], 
                           cursorRectSize);
                                
}

function render(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(hills, 0, 0);
    
    Sight.draw();
}

var updateIntervalID = window.setInterval(update, 5);
var RenderIntervalID = window.setInterval(render, 1000 / FPS);
