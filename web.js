import Noise from './perlin.js'

var noise = new Noise();
var canvas = null;

export default () => {
  document.getElementById("genButton").addEventListener('click', () => {
    noise.seed(Math.random());
    generateNoise();
  });
  
  generateNoise();
}
  
function generateNoise() {
  var blendAmount = parseInt(document.getElementById("blendAmount").value);
  
  canvas = document.getElementsByTagName('canvas')[0];
  canvas.width = 1024;
  canvas.height = 768;

  var ctx = canvas.getContext('2d');

  var image = ctx.createImageData(canvas.width, canvas.height);
  var data = image.data;

  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
      var value = Math.abs(noise.perlin2(x / 100, y / 100));
      value *= 256;

      var cell = (x + y * canvas.width) * 4;
      var color = [];
      
      var shoreNoise = Math.floor(Math.random() * 5);
      
      if (value < 45-shoreNoise) {
        color = colorWater(cell);      
      }
      else if (value < 90) {
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
  
  if (blendAmount != 0) {
    data = blendPixels(data, blendAmount);
  }
  
  ctx.putImageData(image, 0, 0);
}

function colorWater(cell) {
  var colorNoise = Math.floor(Math.random() * 20);
  return [0, 0, 255-colorNoise, 255];
}

function colorLand(cell) {
  var colorNoise = Math.floor(Math.random() * 20);
  return [200-colorNoise, 200-colorNoise, 0, 255];
}

function colorMtn(cell) {
  var colorNoise = Math.floor(Math.random() * 20);
  return [150-colorNoise, 150-colorNoise, 0, 255];
}

function getPixelsInRad(x, y, rad) {
  var retArray = new Array();
  for(var i = rad * -1; i < rad; i++) {
    for (var j = rad * -1; j < rad; j++) {
      retArray.push([x + i,y + j]);
    }
  }
  return retArray;
}



function blendPixels(data, radius) {
  var postProcessData = Object.create(data);
  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
       var cell = (x + y * canvas.width) * 4;
       var blendInput = getPixelsInRad(x, y, radius);
       for (var i=0; i < blendInput.length; i++) {
         var blendCell = (blendInput[i][0]+x + blendInput[i][1]+y * canvas.width) * 4;
         postProcessData[cell] = (postProcessData[cell] + postProcessData[blendCell]) / 2; // red
         postProcessData[cell+1] = (postProcessData[cell+1] + postProcessData[blendCell+1]) / 2; // green
         postProcessData[cell+2] = (postProcessData[cell+2] + postProcessData[blendCell+2]) / 2; // blue
         postProcessData[cell+3] = (postProcessData[cell+3] + postProcessData[blendCell+3]) / 2; // alpha
       }
    }
  }
  return postProcessData;
  
}

