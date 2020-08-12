import Noise from './perlin.js'

var noise = new Noise();

export default () => {
  document.getElementById("genButton").addEventListener('click', () => {
    noise.seed(Math.random());
    generateNoise();
  });
  
  generateNoise();
}
  
function generateNoise() {
  var canvas = document.getElementsByTagName('canvas')[0];
  canvas.width = 1024;
  canvas.height = 768;

  var ctx = canvas.getContext('2d');

  var image = ctx.createImageData(canvas.width, canvas.height);
  var data = image.data;

  var start = Date.now();

  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
      var value = Math.abs(noise.perlin2(x / 100, y / 100));
      value *= 256;

      var cell = (x + y * canvas.width) * 4;
      var color = [];
      
      if (value < 45) {
        color = colorWater(cell);      
      }
      else if (value < 60) {
        color = colorLand(cell);
      }
      else {
        color = colorMtn(cell);
      }
      
      data[cell] = color[0]
      data[cell+1] = color[1]
      data[cell+2] = color[2]
      data[cell+3] = color[3]
      
    }
  }
  var end = Date.now();

  ctx.fillColor = 'black';
  ctx.fillRect(0, 0, 100, 100);
  ctx.putImageData(image, 0, 0);


  ctx.font = '16px sans-serif'
  ctx.textAlign = 'center';
  ctx.fillText('Rendered in ' + (end - start) + ' ms', canvas.width / 2, canvas.height - 20);

  if(console) {
    console.log('Rendered in ' + (end - start) + ' ms');
  }
}

function colorWater(cell) {
  var colorNoise = Math.floor(Math.random() * 10);
  return [0, 0, 255-colorNoise, 255];
}

function colorLand(cell) {
  var colorNoise = Math.floor(Math.random() * 10);
  return [200-colorNoise, 200-colorNoise, 0, 255];
}

function colorMtn(cell) {
  var colorNoise = Math.floor(Math.random() * 10);
  return [150-colorNoise, 150-colorNoise, 0, 255];
}

