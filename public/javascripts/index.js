var output = document.getElementById('output');

var printVals = function(vals) {
  output.textContent = vals.join(", ");
};

var handleOrientation = function(event) {
  var vals = [event.alpha, event.beta, event.gamma].map(function(e) {
    return Math.round(e*1000)/1000;
  
  });
  printVals(vals);
};

printVals([1, 2, 3]);

var i = 0;
setInterval(function() {
  printVals([i, i+1, i+2]);
}, 1000);

window.addEventListener("deviceorientation", handleOrientation, true);
alert("toast!")
