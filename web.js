import Noise from './perlin.js'

class SettingObject {
  constructor() {
    this.seed = 0;
    this.canvas = null;
    this.noise1 = 0;
    this.noise2 = 0;
    this.blendRadius = 0;
    this.scale = 0;
    this.fuzz = 0;
    this.seaLevel = 0;
    this.randomDiffuse = 0;
    this.isHeightMap = false;
    this.useAsync = false;    
  }
}

var settings = new SettingObject();

export default () => {
  document.getElementById("genButton").addEventListener('click', () => {
    generateMap(settings);
  });

  document.getElementById("heightRange").oninput = function() {
    generateMap(settings);
  }
  
  document.getElementById("randomDiffuse").oninput = () => {
    generateMap(settings);
  };
  
  firstRun();
}

function firstRun() {
  settings.blendRadius = document.getElementById("blendAmount").value = 0;
  settings.fuzz = document.getElementById("fuzz").value = 5;
  settings.scale = document.getElementById("scale").value = 100;
  settings.seaLevel = document.getElementById("heightRange").value = 70;
  settings.randomDiffuse = document.getElementById("randomDiffuse").value = 1;

  settings.canvas = document.getElementsByTagName('canvas')[0];
  settings.canvas.width = 1024;
  settings.canvas.height = 740;
  
  settings.noise2 = new Promise((resolve, reject) => {
      resolve(callGenerateNoise(settings, 1));
    });

  settings.noise1 = new Promise((resolve, reject) => {
      resolve(callGenerateNoise(settings));
    });
  
  generateMap(settings);
}

function callGenerateNoise(settings, add) {
  generateNoise(settings, add);
}

async function generateMap(settings) {
  if (document.getElementById("newSeedCheck").checked) {
    settings.seed = Math.random();
  }
  var start = Date.now();
  var times = new Array();
  times.push(["Start:", Date.now()]);

  var ctx = settings.canvas.getContext('2d');

  var image = ctx.createImageData(settings.canvas.width, settings.canvas.height);
  var imageData = image.data;

  settings.scale = document.getElementById("scale").value;
  settings.fuzz = document.getElementById("fuzz").value;
  settings.seaLevel = document.getElementById("heightRange").value;
  settings.isHeightMap = document.getElementById("isHeightMap").checked;
  settings.randomDiffuse = document.getElementById("randomDiffuse").value;
  settings.useAsync = document.getElementById("useAsync").checked;
  
  times.push(["Initialize:", Date.now()]);
  
  var avgNoise;
  if (settings.useAsync) {    
    times.push(["Created Promises:", Date.now()]);
    const noiseResponses = await Promise.all([settings.noise1, settings.noise2]);  
    avgNoise = diffuseRandomMap(noiseResponses[0], noiseResponses[1], settings.randomDiffuse, settings.seaLevel);
  }
  else {
    var noise1 = generateNoise(settings);
    var noise2 = generateNoise(settings, 1);
    avgNoise = diffuseRandomMap(noise1, noise2, settings.randomDiffuse, settings.seaLevel);
  }
  
  times.push(["Generated Noise:", Date.now()]);

  imageData = colorNoise(avgNoise, imageData, settings.fuzz, settings.seaLevel, settings.isHeightMap, settings.canvas);  
  times.push(["Coloring:", Date.now()]);

  
  if (settings.blendRadius != 0) {
    imageData = boxBlur(imageData, settings.blendRadius, settings.canvas);
    times.push(["Blur:", Date.now()]);
  }
    
  ctx.putImageData(image, 0, 0);
  times.push(["Render:", Date.now()]);
  var logStr = "";
  for (var i=1; i < times.length; i++) {    
    logStr += `${times[i][0]} ${times[i][1] - times[i-1][1]}ms elapsed (${times[i][1] - start} total)`;
    logStr += "\n";
  }
  console.log(logStr);
}

function generateNoise(settings, seedAdd=0) {
  var noise = new Noise();
  noise.seed(settings.seed + seedAdd);  

  var noiseData = new Array();  
  for (var x = 0; x < settings.canvas.width; x++) {
    noiseData.push(new Array());
    for (var y = 0; y < settings.canvas.height; y++) {
      var value = Math.abs(noise.perlin2(x / settings.scale, y / settings.scale));
      value *= 256;
      noiseData[x].push(value);
    }
  } 
  return noiseData;
}

function colorNoise(avgNoise, data, fuzz, seaLevel, isHeightMap, canvas) {
  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) { 
      var value = avgNoise[x][y];
      var cell = (x + y * canvas.width) * 4;
      var color = [];
      
      var borderNoise = Math.floor(Math.random() * fuzz);
      if (isHeightMap) {
        color = colorHeight(value);
      } 
      else {
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
      }

      data[cell] = color[0]
      data[cell+1] = color[1]
      data[cell+2] = color[2]
      data[cell+3] = color[3]
      
    }
  }
  return data;  
}

function colorWater(cell) {
  var colorNoise = Math.floor(Math.random() * 50);
  return [0, 0+colorNoise, 255-colorNoise, 255];
}

function colorDeepWater(cell) {
  var colorNoise = Math.floor(Math.random() * 50);
  return [0, 0+colorNoise/4, 200-colorNoise*2, 255];
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

function diffuseRandomMap(noise1, noise2, randomDiffuse, seaLevel) {
  var retNoise = [];
  for(var i=0; i < noise1.length; i++) {
    retNoise.push(new Array());
    for(var j=0; j < noise1[i].length; j++) {
      var amountToChange = noise2[i][j] - noise1[i][j];
      var changeDiff = amountToChange / randomDiffuse;
      var averagedValue = noise1[i][j] + changeDiff;
      
      retNoise[i].push(averagedValue);
    }
  }
  return retNoise;
  
}

function boxBlur(data, radius, canvas) {
  var postProcessData = Object.assign(data);
  for (var x = 0; x < canvas.width; x++) {
    for (var y = 0; y < canvas.height; y++) {
       var cell = getCellByCoord(new Coord(x,y), canvas);
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

function getCellByCoord(coord, canvas) {
   return (coord.x + coord.y * canvas.width) * 4;
}

