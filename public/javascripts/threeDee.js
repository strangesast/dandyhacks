var dropletFactory;
var three_access_point = function(referenceObject) {
  var box = referenceObject.getBoundingClientRect();
  var width = box.width;
  var height = box.height;

  var currentAlpha = 0;
  var currentBeta = 0;
  var currentGamma = 0;
  var newAlpha = 0;
  var newBeta = 0;
  var newGamma = 0;
  
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45,width/height,0.1,1000);
  var renderer = new THREE.WebGLRenderer();
  
  renderer.setClearColor(0xE5F2F9,1);
  renderer.setSize( width, height);
  
  scene.add(camera);      
  
  var axis = new THREE.AxisHelper(10);
  scene.add(axis);
  
  var droplet,floor;
  
  floor = new THREE.Mesh(new THREE.PlaneBufferGeometry(width-50,width-50), new THREE.MeshLambertMaterial({map: THREE.ImageUtils.loadTexture('images/shower_tile2.jpg')}));
  scene.add(floor);
  
  camera.position.set(0,0,800);
  camera.lookAt(scene.position);
  var light = new THREE.AmbientLight(0xffffff);
  scene.add(light);
  
  var hemilight = new THREE.HemisphereLight(0xffffff,0xffffff,0.6);
  hemilight.color.setHSL(0.6,1,0.6);
  hemilight.groundColor.setHSL(0.095,1,0.75);
  hemilight.position.set(0,0,200);
  scene.add(hemilight);
  
  
  var tricklets = {};
  var icelets = {};

  var loader = new THREE.JSONLoader();

  loader.load("/models/dropplet4.js",function(geometry,materials){
    var material = new THREE.MeshFaceMaterial(materials);

    dropletFactory = function() {
      droplet = new THREE.Mesh(geometry,material);
      droplet.position.set(0,0,100);
      droplet.rotation.y = 90*Math.PI/180;
      droplet.scale.set(5,5,5);
      scene.add(droplet);
      return droplet;
    };

    socket_setup_function();

    //for(i = 0; i < 25; i++){
    //  var xpos = getRandomInt(-100, 100);
    //  var ypos = 150; //top of window
  
    //  tricklets[i] = new THREE.Mesh(geometry,material);
    //  tricklets[i].position.set(xpos,ypos,100);
    //  tricklets[i].rotation.y = 90*Math.PI/180;
    //  tricklets[i].scale.set(3,3,3);
    //  scene.add(tricklets[i]);
  
    //  xpos = getRandomInt(-width/2, width/2);
  
    //  icelets[i] = new THREE.Mesh(geometry,material);
    //  icelets[i].position.set(xpos,ypos,100);
    //  icelets[i].rotation.y = 90*Math.PI/180;
    //  icelets[i].scale.set(10,10,10);
    //  scene.add(icelets[i]);
    //}
  });
  
  var replacedElement = document.getElementById('canvas-element');
  var newElement = renderer.domElement;
  newElement.setAttribute('id', 'canvas-element');
  replacedElement.parentElement.replaceChild(newElement, replacedElement);
  
  var render = function () {
  	requestAnimationFrame( render );
  
    //droplet.translateY(-newBeta/100);
    //droplet.translateZ(newGamma/100);
  
    //for(i = 0; i < 25; i++){
    //  icelets[i].translateY(-1 + (i/25));
    //  icelets[i].rotation.y += 0.03;
  
    //  tricklets[i].translateY(-1.2 + (i/25));
    //  tricklets[i].rotation.y += 0.14;
    //}
  	renderer.render(scene, camera);
  };
  
  var handleOrientation = function(event){
      newAlpha = event.alpha;
      newBeta = event.beta;
      newGamma = event.gamma;
  };
  window.addEventListener("deviceorientation",handleOrientation,true);
  
  function getRandomInt(min,max){
    return Math.floor(Math.random() * (max-min+1))+min;
  }
  
  
  return {
    'render' : render
  };
}(document.getElementById('canvas-element').parentElement);
