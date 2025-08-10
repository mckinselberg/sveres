// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_building_practice
// import { throttle } from 'lodash';

document.title = 'triangles';


var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var width = canvas.width = window.innerWidth;
var height = canvas.height = window.innerHeight;

function random(min, max) {
    var num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}


function Square(x, y, color, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
}

Square.prototype.draw = function() {
  ctx.beginPath();
  ctx.moveTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  ctx.globalAlpha = Math.random() * .99;
  ctx.fillStyle = 'rgb(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) +','+ random(0,1)+ ')';
  ctx.fill();
}



var squares = [];

while(squares.length < 10) {
  var size = 19; //random(squareSize, squareSize);
  var square = new Square(
      random(0 + size, width - size),
      random(0 + size, height - size),
      10,
      10,
      'rgb(' + random(0,255) + ',' + random(0,255) + ',' + random(0,255) + ')',
      size  
  );
  squares.push(square);
}

//ctx.fillStyle = 'blue';
//ctx.fillRect(0,0, width, height);

function loop() {
    //ctx.fillStyle = 'rgba(0,0,0,0.25)';
    //ctx.fillRect(200,200,100,100);
    for (var i = 0; i < 5; i++) {
        squares[i].draw();
        //squares[i].update();
        //squares[i].collisionDetect();
    }
    setTimeout(loop,1000);
    
    
    // setInterval(function(){
    //   loop();
    // },1000)
    
}
loop();

window.addEventListener('resize',function(){
  
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
})