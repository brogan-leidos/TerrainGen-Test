import Noise from './perlin.js'

onmessage = function(seedAdd, settings) {
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
  postMessage(noiseData);
};
