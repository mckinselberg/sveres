import { throttle } from 'lodash';

//function Square() {
  const canvas = document.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  var width = canvas.width = window.innerWidth;
  var height = canvas.height = window.innerHeight;
  let colors = ['lime','salmon','pink','turquoise','black'];
  ctx.fillStyle = colors[0];
  ctx.globalCompositeOperation = "xor";
//}

function returnRandom(down,up) {
  return _.random(down,up,true)
}



function loop() {
  
  //ctx.fillStyle = `rgba(${returnRandom(0,255)},${returnRandom(0,255)},${returnRandom(0,255)},0.25)`;
  //ctx.fillStyle = `rgba(236, 135, 135,.75)`;
  //ctx.fillRect(0,0, width, height);
  //ctx.fillStyle = `rgba(${returnRandom(0,255)},${returnRandom(0,255)},${returnRandom(0,255)},0.75)`;
  //ctx.fillRect(200,200,100,100);
  for (var i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(${returnRandom(0,255)},${returnRandom(0,255)},${returnRandom(0,255)},0.75)`;
    //ctx.fillStyle = `rgba(${returnRandom(0,255)},${returnRandom(0,255)},${returnRandom(0,255)},0.11175)`;
    ctx.fillRect(returnRandom(0,width),returnRandom(0,height),returnRandom(0,10),returnRandom(0,10));
    //ctx.fillRect(200,200,100,100);
    
  }
  requestAnimationFrame(loop);
}

loop();

window.addEventListener('resize',function(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})