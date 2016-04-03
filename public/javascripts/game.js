var reconnectInterval = null;
var socketAddress = "ws://" + window.location.host + "/sockets";
var activePlayer = null;
var playerBoard = null;
var sendMessage;

var socketOpenListener = function(e) {
  console.log('socket opened!');
  // create player || use existing player from localStorage
  clearInterval(reconnectInterval);
  var currentPlayer = localStorage.getItem("player");
  initMessage = {'type' : 'init'};
  if(currentPlayer) {
    initMessage.id = currentPlayer;
    new Player(currentPlayer);
  } else if (activePlayer != null) {
    initMessage.id = activePlayer.id

  } else {
    temp_id = Player.generateRandomId();
    temp_ids.push(temp_id);
    initMessage.temp_id = temp_id;
    new Player(temp_id);
  }
  sendMessage(initMessage);
};

var socketMessageListener = function(messageEvent) {
  var parsed;
  try {
    parsed = JSON.parse(messageEvent.data);
  } catch (e) {
    parsed = null;
    console.error("invalid json!");
    console.error(messageEvent.data);
    return;
  }
  var player;
  if(parsed.type === 'init' && (player = Player.getPlayerById(parsed.data.id))) {
    // player exists already, you're good

  } else if (parsed.type === 'init' && (player = Player.getPlayerById(temp_ids.pop()))) {
    // swap out temp id from Player 'list'
    delete Player.players[player.id];
    player.id = parsed.data.id;
    Player.players[player.id] = player;

    playerBoard.addPlayer(player);
    activePlayer = player;
    window.requestAnimationFrame(playerBoard.redraw.bind(playerBoard));

  } else if (parsed.type === 'update') {
    parsed.objects.forEach(function(elem) {
      var player;
      if(elem.id in playerBoard.players) {
        player = playerBoard.players[elem.id];

      } else {
        player = new Player(elem.id);
        playerBoard.addPlayer(player);
      }
      if('position' in elem) {
        player.changePosition([elem.position.x, elem.position.y]);

      } else if ('deleted' in elem) {
        playerBoard.removePlayer(player);
      }

      window.requestAnimationFrame(playerBoard.redraw.bind(playerBoard));
    });
  }
};

var socketCloseListener = function(e) {
  console.log('server connection closed...');
  reconnectInterval = setInterval(function() {
    console.log('trying to reconnect...');
    socket = new WebSocket(socketAddress);
    addSocketListeners(socket);
  }, 2000);
};

var socketErrorListener = function(e) {
  console.log('error: ');
  console.log(e);
};

var addSocketListeners = function(socket) {
  socket.onopen = socketOpenListener;
  socket.onmessage = socketMessageListener;
  socket.onclose = socketCloseListener;
  socket.onerror = socketErrorListener;
};

var initGame = function() {
  console.log('starting game code...');
  // initiate socket connection
  var socket = new WebSocket(socketAddress);
  sendMessage = function(message) {
    socket.send(JSON.stringify(message));
  };
  addSocketListeners(socket);
  
  var temp_ids = [];
  var text_element = document.getElementById('output');
  var canvas_element = document.getElementById('canvas-element');
  var parentDims = canvas_element.parentElement.getBoundingClientRect();
  playerBoard = new Board(canvas_element, parentDims.width, parentDims.height);
  
  var activePlayerRaw = sessionStorage.getItem('activePlayer');
  activePlayer = new Player(JSON.parse(activePlayerRaw)._id);
  playerBoard.addPlayer(activePlayer);

  var count = 5;
  for(var i=0; i<count+1; i++) {
    var ob = new Obstacle(canvas_element.width, canvas_element.height*i/count, 10*Math.random(), 'green');
    playerBoard.obstacles.push(ob);
  }
  setInterval(function() {
    var ypos = Math.random()*canvas_element.height;
    var xpos = canvas_element.width;
    var ob = new Obstacle(xpos, ypos, 10*(0.2+Math.random()*0.8), 'green');
    playerBoard.obstacles.push(ob);
  }, 1000);

  playerBoard.redraw();

  document.onkeydown = function(key_event) {
    var keyCode = key_event.keyCode;
    if(keyCode === 37) {
      // left
      playerBoard.movePlayerTo(activePlayer, [-20, 0], false);
    } else if(keyCode === 38) {
      // up
      playerBoard.movePlayerTo(activePlayer, [0, -20], false);
    } else if(keyCode === 39) {
      // right
      playerBoard.movePlayerTo(activePlayer, [20, 0], false);
    } else if(keyCode === 40) {
      // down
      playerBoard.movePlayerTo(activePlayer, [0, 20], false);
    }
  };
  
  window.addEventListener("deviceorientation", function(orientation_event) {
    //text_element.textContent = [orientation_event.alpha, orientation_event.beta, orientation_event.gamma].join(', ');
    var vals = [Math.round(orientation_event.gamma*10)/50, Math.round(orientation_event.beta*10)/50];
    playerBoard.movePlayerTo(activePlayer, vals, false);
  }, true);
};
