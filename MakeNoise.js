import Noise from './perlin.js'

self.addEventListener('message', (e) => {
  //e [seed, width, height, scale]
  var noise = new Noise();
  var width = e.data[1];
  var height = e.data[2];
  var scale = e.data[3];
  
  var noiseData = new Array();
  
  for (var x = 0; x < width; x++) {
    noiseData.push(new Array());
    for (var y = 0; y < height; y++) {
      var value = Math.abs(noise.perlin2(x / scale, y / scale));
      value *= 256;
      noiseData[x].push(value);
    }
  }
  
  
  self.postMessage(noiseData);
  self.close();
});
