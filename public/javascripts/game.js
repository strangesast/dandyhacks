var reconnectInterval = null;
var socketAddress = "ws://" + window.location.host + "/sockets";
var activePlayer = null;
var playerBoard = null;
var sendMessage;

var socketOpenListener = function(e) {
  console.log('socket opened!');
  // create player || use existing player from localStorage
  clearInterval(reconnectInterval);
  var currentPlayerRaw = sessionStorage.getItem('activePlayer');
  var currentPlayer = currentPlayerRaw ? JSON.parse(currentPlayerRaw) : null;

  if(currentPlayer) {
    initMessage = {'type' : 'init', 'id' : currentPlayer._id};
    player = new Player(currentPlayer._id, currentPlayer.username);
    sendMessage(initMessage);

  } else {
    window.location.hash = '/index';
  }
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
    console.log("Name: " + parsed.name);
    // player exists already, you're good

  } else if (parsed.type === 'init' && (player = Player.getPlayerById(temp_ids.pop()))) {
    console.log("Name: " + parsed.name);
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
        player = new Player(elem.id, elem.username);
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
  var activePlayerProps = JSON.parse(activePlayerRaw);
  activePlayer = new Player(activePlayerProps._id, activePlayerProps.username);
  playerBoard.addPlayer(activePlayer);

  setInterval(function() {
    if(playerBoard.obstacles.length < 12) {
      playerBoard.obstacles.push({x: canvas_element.width, y:(0.1+Math.random()*0.8)*canvas_element.height});
    }
  }, 500);

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
