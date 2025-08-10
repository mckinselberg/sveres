// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_building_practice
// import { throttle } from 'lodash';

document.title = 'shapes';


var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var width = canvas.width = window.innerWidth;
var height = canvas.height = window.innerHeight;

function random(min, max) {
    var num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}


function Shape(x, y, color, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
}

Shape.prototype.draw = function() {
  ctx.beginPath();
  ctx.moveTo(random(0, window.innerWidth), random(0, window.innerHeight));
  for (let i = 0; i < 10; i++) {
    ctx.lineTo(random(0, window.innerWidth), random(0, window.innerHeight));
  }
  
  ctx.globalAlpha = Math.random() * .01;
  //ctx.fillStyle = 'rgb(' + random(0) + ',' + random(1) + ',' + random(0, 255) +')';
  ctx.fillStyle = 'rgb(9,255,23)';
  //ctx.fillStyle = 'rgb(255,255,255)';
  ctx.fill();
}



var shapes = [];

while(shapes.length < 100) {
  var size = 19; //random(shapeSize, shapeSize);
  var shape = new Shape(
      random(0 + size, width - size),
      random(0 + size, height - size),
      10,
      10,
      'rgb(' + random(0,255) + ',' + random(0,255) + ',' + random(0,255) + ')',
      size  
  );
  shapes.push(shape);
}

//ctx.fillStyle = 'blue';
//ctx.fillRect(0,0, width, height);

function loop() {
    //ctx.fillStyle = 'rgba(0,0,0,0.25)';
    //ctx.fillRect(200,200,100,100);
    for (var i = 0; i < 5; i++) {
        shapes[i].draw();
        //shapes[i].update();
        //shapes[i].collisionDetect();
    }
    
    
    // setInterval(function(){
    //   loop();
    // },1000)
    
}
setTimeout(()=>setInterval(()=>loop(),100),500);

window.addEventListener('resize',function(){
  
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
})