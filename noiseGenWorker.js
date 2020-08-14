
onmessage = function(event) {
  // Seedadd, settings, noise
  var seedAdd = event.data.seedAdd;
  var settings = event.data.settings;
  var noise = event.data.noise;
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
