var output = document.getElementById('ouput')

var printVals = function(vals) {
  output.textContent = vals.join(", ");
};


var handleOrientation = function(event) {
  var vals = [event.alpha, event.beta, event.gamma];
  printVals(vals);
};

window.addEventListener("deviceorientation", handleOrientation, true);
