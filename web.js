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
  var start = Date.now();
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
      
      var shoreNoise = Math.floor(Math.random() * 15 + 5);
      
      if (value < 55-shoreNoise) {
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
    data = boxBlur(data, blendAmount);
  }
  
  var end = Date.now();
  console.log('Rendered in ' + (end - start) + ' ms');
  
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




function boxBlur(data, radius) {
  var postProcessData = Object.assign(data);
  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
       var cell = getPixelByCoord(x,y);
       var blendInput = getPixelsInRad(x, y, radius);
       var averagedColorCell = averagePixels(blendInput, data);
       
       postProcessData[cell] = averagedColorCell[0];
       postProcessData[cell+1] = averagedColorCell[1];
       postProcessData[cell+2] = averagedColorCell[2];      
    }
  }
  return postProcessData;
  
}

function getPixelsInRad(x, y, rad) {
  var ret = new Array();
  for(var i = rad * -1; i < rad; i++) {
    var row = new Array();
    for (var j = rad * -1; j < rad; j++) {
      row.push([x + i, y + j]);
    }
    ret.push(row);
  }
  return ret;
}

function averagePixels(pixels, data) {
  var redTotal = 0;
  var greenTotal = 0;
  var blueTotal = 0;

  for (var y=0; y < pixels.length; y++) {
    var redRowTotal = 0;
    var greenRowTotal = 0;
    var blueRowTotal = 0;
    
    for (var x=0; x < pixels[y].length; x++) {
      var scanCell = getPixelByCoord(pixels[x][0], pixels[y][1]);
      redRowTotal += data[scanCell];
      greenRowTotal += data[scanCell+1];
      blueRowTotal += data[scanCell+2];
    }
    redTotal += redRowTotal / pixels[y].length;
    greenTotal += greenRowTotal / pixels[y].length;
    blueTotal += blueRowTotal / pixels[y].length;
  }
  
  redTotal /= pixels.length;
  greenTotal /= pixels.length;
  blueTotal /= pixels.length;
  
  return [redTotal, greenTotal, blueTotal];
}

function getPixelByCoord(x, y) {
   return (x + y * canvas.width) * 4;
}

