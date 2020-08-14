import Noise from './perlin.js'

class SettingObject {
  constructor() {
    this.seed = 0;
    this.canvas = null;
    this.blendRadius = 0;
    this.scale = 0;
    this.fuzz = 0;
    this.seaLevel = 0;
    this.randomDiffuse = 0;
    this.isHeightMap = false;
    this.useAsync = false;
    
    this.valueMap = [];
  }
}

var settings = new SettingObject();
var times = new Array();

export default () => {
  document.getElementById("genButton").addEventListener('click', () => {
    generateMap();
  });

  document.getElementById("heightRange").oninput = function() {
    generateMap();
  }
  
  document.getElementById("randomDiffuse").oninput = () => {
    generateMap();
  };
  
  firstRun();
}

function firstRun() {
  settings.blendRadius = document.getElementById("blendAmount").value = 0;
  settings.fuzz = document.getElementById("fuzz").value = 5;
  settings.scale = document.getElementById("scale").value = 100;
  settings.seaLevel = document.getElementById("heightRange").value = 70;
  settings.randomDiffuse = document.getElementById("randomDiffuse").value = 1;
  settings.numDiffuseMaps = document.getElementById("numDiffuseMaps").value = 2;
  
  settings.canvas = document.getElementsByTagName('canvas')[0];
  settings.canvas.width = 1024;
  settings.canvas.height = 740; 
  
  generateMap();
}

async function generateMap() {
  if (document.getElementById("newSeedCheck").checked) {
    settings.seed = Math.random();
  }
  var start = Date.now();
  times = [];
  logTime("Start");
  var ctx = settings.canvas.getContext('2d');

  var image = ctx.createImageData(settings.canvas.width, settings.canvas.height);
  var imageData = image.data;
  
  initializeSettings();
  
  logTime("Initialize");
  
  var avgNoise;
  if (settings.useAsync) {
    var noiseResponses = [];
    var numWorkers = 2;
    var allWorkersDone = (numWorkers) => {
      return new Promise((resolve) => { 
        if (noiseResponses.length == numWorkers) {
          resolve();
        }
      });
    };
    var noise = new Noise();
    for (var i=0; i < numWorkers; i++) {
      var newWorker = new Worker("noiseGenWorker.js", { type: "classic" });
      newWorker.onmessage = (e) => {
        noiseResponses.push(e.data);
      }
      newWorker.postMessage([i, JSON.stringify(settings), settings.canvas.width, settings.canvas.height])
    }
    
    logTime("Created Workers");
    var x = await allWorkersDone(numWorkers);
    logTime("Workers Done");
    avgNoise = diffuseRandomMap(noiseResponses[0], noiseResponses[1], settings.randomDiffuse, settings.seaLevel);
  }
  else {
    var noiseGroup = [];
    var numDiffuseMaps = settings.numDiffuseMaps;
    for (var i=0; i < numDiffuseMaps; i++) {
      noiseGroup.push(generateNoise(i));
    }

    avgNoise = diffuseRandomMap(noiseGroup, settings.randomDiffuse, settings.seaLevel);
  }
  
  logTime("Generated Noise");

  settings.valueMap = avgNoise;
  imageData = colorNoise(avgNoise, imageData, settings.fuzz, settings.seaLevel, settings.isHeightMap, settings.canvas);  
  logTime("Coloring");
  
  if (settings.blendRadius != 0) {
    imageData = boxBlur(imageData, settings.blendRadius, settings.canvas);
    logTime("Blur");
  }
    
  ctx.putImageData(image, 0, 0);
  logTime("Render");
  var logStr = "";
  for (var i=1; i < times.length; i++) {    
    logStr += `${times[i][0]} ${times[i][1] - times[i-1][1]}ms elapsed (${times[i][1] - start} total)`;
    logStr += "\n";
  }
  console.log(logStr);
}

function initializeSettings() {
  settings.blendRadius = document.getElementById("blendAmount").value;
  settings.scale = document.getElementById("scale").value;
  settings.fuzz = document.getElementById("fuzz").value;
  settings.seaLevel = document.getElementById("heightRange").value;
  settings.isHeightMap = document.getElementById("isHeightMap").checked;
  settings.randomDiffuse = document.getElementById("randomDiffuse").value;
  settings.numDiffuseMaps = document.getElementById("numDiffuseMaps").value;
  settings.useAsync = document.getElementById("useAsync").checked;
}

function logTime(title) {
  times.push([title + ":", Date.now()]);
}

function generateNoise(seedAdd=0) { 
  var noise = new Noise();
  noise.seed(settings.seed + (seedAdd * .01));  

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
          color = colorDeepWater(value);
        }      
        else if (value < seaLevel - borderNoise) {
          color = colorWater(value);      
        }
        else if (value < (seaLevel * 1.75) - borderNoise) {
          color = colorLand(value);
        }
        else if (value < (seaLevel * 2.5) - borderNoise) {
          color = colorGrassland(value);
        }
        else if (value < (seaLevel * 4) - borderNoise) {
          color = colorForest(value);
        }
        else {
          color = colorMtn(value);
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

function colorWater(value) {
  var colorNoise = Math.floor(Math.random() * 30);
  return [20, 0+colorNoise/2, 230-colorNoise, 255];
}

function colorDeepWater(value) {
  var colorNoise = Math.floor(Math.random() * (50-value));
  return [0, 0+colorNoise/4, 200-colorNoise*2, 255];
}

function colorLand(value) {
  var colorNoise = Math.floor(Math.random() * 20);
  return [200-colorNoise, 200-colorNoise, 0, 255];
}

function colorForest(value) {
  var colorNoise = Math.floor(Math.random() * 40);
  return [0+colorNoise, 150-colorNoise, 0+colorNoise/10, 255];
}
function colorGrassland(value) {
  var colorNoise = Math.floor(Math.random() * 10);
  return [120+colorNoise, 180-colorNoise, 60+colorNoise, 255];
}

function colorMtn(value) {
  var colorNoise = Math.floor(Math.random() * 20);
  return [230-colorNoise, 230-colorNoise, 255, 255];
}

function colorHeight(value) {
  return [value, value, value, 255];
}

function diffuseRandomMap(noiseGroup, randomDiffuse, seaLevel) {
  var retNoise = noiseGroup[0];
  for(var i=0; i < retNoise.length; i++) {    
    for(var j=0; j < retNoise[i].length; j++) {
      for (var noiseSheet=1; noiseSheet < noiseGroup.length; noiseSheet++) {        
        var amountToChange = noiseGroup[noiseSheet][i][j] - retNoise[i][j];
        var changeDiff = amountToChange / (randomDiffuse*.5);
        retNoise[i][j] += changeDiff;
      }      
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
      var scanCell = getCellByCoord(pixelCoordGroup[group][unit], settings.canvas);
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

