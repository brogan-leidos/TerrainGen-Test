import Noise from './perlin.js'

var noise = new Noise();
var canvas = null;

export default () => {
  document.getElementById("genButton").addEventListener('click', () => {
    generateNoise();
  });

  document.getElementById("heightRange").oninput = function() {
    generateNoise();
  }
  
  firstRun();
}

function firstRun() {
  document.getElementById("blendAmount").value = 0;
  document.getElementById("fuzz").value = 5;
  document.getElementById("scale").value = 100;
  document.getElementById("heightRange").value = 70;

  generateNoise();
}

function generateNoise() {
  var seed = 0;
  if (document.getElementById("newSeedCheck").checked) {
    seed = Math.random();
    noise.seed(seed);
  }  
  
  var start = Date.now();
  var blendAmount = parseInt(document.getElementById("blendAmount").value);
  
  canvas = document.getElementsByTagName('canvas')[0];
  canvas.width = 1024;
  canvas.height = 768;

  var ctx = canvas.getContext('2d');

  var image = ctx.createImageData(canvas.width, canvas.height);
  var data = image.data;

  var scale = document.getElementById("scale").value;
  var fuzz = document.getElementById("fuzz").value;
  var seaLevel = document.getElementById("heightRange").value;
  var isHeightMap = document.getElementById("isHeightMap").checked;
  
  var noise1 = new Array();
  var noise2 = new Array();
  
  for (var x = 0; x < canvas.width; x++) {
    noise1.push(new Array());
    for (var y = 0; y < canvas.height; y++) {
      var value = Math.abs(noise.perlin2(x / scale, y / scale));
      value *= 256;
      noise1[x].push(value);
    }
  }
  
  noise.seed(seed+1);
  for (var x = 0; x < canvas.width; x++) {
    noise2.push(new Array());
    for (var y = 0; y < canvas.height; y++) {
      var value = Math.abs(noise.perlin2(x / scale, y / scale));
      value *= 256;
      noise2[x].push(value);
    }
  }
  
  var avgNoise = averageNoise(noise1, noise2);
  
  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) { 
      var value = avgNoise[x][y];
      var cell = (x + y * canvas.width) * 4;
      var color = [];
      
      var borderNoise = Math.floor(Math.random() * fuzz);
      
      if (value < (seaLevel / 2) - borderNoise) {
        color = colorDeepWater(cell);
      }      
      else if (value < seaLevel - borderNoise) {
        color = colorWater(cell);      
      }
      else if (value < (seaLevel * 2) - borderNoise) {
        color = colorLand(cell);
      }
      else if (value < (seaLevel * 3) - borderNoise) {
        color = colorForest(cell);
      }
      else {
        color = colorMtn(cell);
      }
      
      if (isHeightMap) {
        color = colorHeight(value);
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
  var colorNoise = Math.floor(Math.random() * 50);
  return [0, 0+colorNoise, 255-colorNoise, 255];
}

function colorDeepWater(cell) {
  var colorNoise = Math.floor(Math.random() * 50);
  return [0, 0+colorNoise/2, 255-colorNoise*2, 255];
}

function colorLand(cell) {
  var colorNoise = Math.floor(Math.random() * 20);
  return [200-colorNoise, 200-colorNoise, 0, 255];
}

function colorForest(cell) {
  var colorNoise = Math.floor(Math.random() * 40);
  return [0+colorNoise, 150-colorNoise, 0+colorNoise/10, 255];
}

function colorMtn(cell) {
  var colorNoise = Math.floor(Math.random() * 20);
  return [230-colorNoise, 230-colorNoise, 255, 255];
}

function colorHeight(value) {
  return [value, value, value, 255];
}

function averageNoise(noise1, noise2) {
  var retNoise = [];
  for(var i=0; i < noise1.length; i++) {
    retNoise.push(new Array());
    for(var j=0; j < noise1[i].length; j++) {
      retNoise[i].push((noise1[i][j] + ( ((noise2[i][j] + noise1[i][j]) / 2) + noise1[i][j]) / 2 ) / 2);
    }
  }
  return retNoise;
  
}

function boxBlur(data, radius) {
  var postProcessData = Object.assign(data);
  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
       var cell = getCellByCoord(new Coord(x,y));
       var pixelCoordGroup = getPixelsInRad(x, y, radius);
       var averagedColorCell = averagePixels(pixelCoordGroup, data);
       
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
      row.push(new Coord(x + i, y + j));
    }
    ret.push(row);
  }
  return ret;
}

function averagePixels(pixelCoordGroup, data) {
  var redTotal = 0;
  var greenTotal = 0;
  var blueTotal = 0;

  for (var group=0; group < pixelCoordGroup.length; group++) {
    var redRowTotal = 0;
    var greenRowTotal = 0;
    var blueRowTotal = 0;
    
    for (var unit=0; unit < pixelCoordGroup[group].length; unit++) {
      var scanCell = getCellByCoord(pixelCoordGroup[group][unit]);
      redRowTotal += data[scanCell];
      greenRowTotal += data[scanCell+1];
      blueRowTotal += data[scanCell+2];
    }
    redTotal += redRowTotal / pixelCoordGroup[group].length;
    greenTotal += greenRowTotal / pixelCoordGroup[group].length;
    blueTotal += blueRowTotal / pixelCoordGroup[group].length;
  }
  
  redTotal /= pixelCoordGroup.length;
  greenTotal /= pixelCoordGroup.length;
  blueTotal /= pixelCoordGroup.length;
  
  return [redTotal, greenTotal, blueTotal];
}

class Coord {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

function getCellByCoord(coord) {
   return (coord.x + coord.y * canvas.width) * 4;
}

