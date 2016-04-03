var Board = class Board {
  constructor(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.playerRadius = 20;

    this.players = {};

    window.onresize = function(_this) {
      return function(e) {
        var box = _this.canvas.parentElement.getBoundingClientRect();
        _this.width = box.width;
        _this.height = box.height;
        _this.canvas.width = box.width;
        _this.canvas.height = box.height;
        _this.redraw()
      };
    }(this);
  }

  redraw() {
    var ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = 'black';
    for(var user_id in this.players) {
      var user = this.players[user_id];
      var x = user.position.x;
      var y = user.position.y;
      ctx.beginPath();
      ctx.arc(x, y, this.playerRadius, 0, 2*Math.PI);
      ctx.fill()
    }
  }

  addPlayer(user) {
    // for now make last-added player default
    this.players[user.id] = user;
  }

  removePlayer(user) {
    console.log('deleted');
    if(user.id in this.players) {
      delete this.players[user.id];
      return true;
    }
    return false;
  }

  movePlayerTo(player, position, absolute) {
    var curx = player.position.x;
    var cury = player.position.y;
    console.log("current: " + [curx, cury]);
    var newx, newy;
    if(absolute) {
      newx = Math.min(Math.max(position[0], this.playerRadius), this.width-this.playerRadius);
      newy = Math.min(Math.max(position[1], this.playerRadius), this.height-this.playerRadius);
    } else {
      newx = Math.min(Math.max(curx+position[0], this.playerRadius), this.width-this.playerRadius);
      newy = Math.min(Math.max(cury+position[1], this.playerRadius), this.height-this.playerRadius);
    }
    player.submitPositionChange([newx, newy]);
  }
}

var User = class User {
  constructor(id) {
    this.id = id;
    this.ready = false;
    User.users[this.id] = this;
    this.position = {
      x: 0,
      y: 0
    }
  }
  submitPositionChange(position) {
    console.log("submit: " + position);
    sendMessage({'id' : this.id, 'type' : 'update', 'position' : {'x':position[0], 'y':position[1]}});
  }

  changePosition(position) {
    console.log("actual: " + position);
    //console.log("new position: " + position.join(", "));
    this.position.x = Number(position[0]);
    this.position.y = Number(position[1]);
  }

  static generateRandomId() {
    return Math.round(Math.random()*100);
  }

  static getUserById(id) {
    if(id in User.users) {
      return User.users[id];
    } else {
      return null;
    }
  }
}

User.users = {};
//  socket.send(JSON.stringify({
//    'type' : 'init'
//  }));
//
//  socket.onmessage = function(messageEvent) {
//    console.log('message:' + messageEvent.data);
//    console.log(messageEvent);
//  };

// initiate socket connection
var socketAddress = "ws://" + window.location.host + "/sockets";
var socket = new WebSocket(socketAddress);
var sendMessage = function(message) {
  socket.send(JSON.stringify(message));
};
var temp_ids = [];


socket.onopen = function(e) {
  // create user || use existing user from localStorage
  var currentUser = localStorage.getItem("user");
  initMessage = {'type' : 'init'};
  if(currentUser) {
    initMessage.id = currentUser;
    new User(currentUser);
  } else {
    temp_id = User.generateRandomId();
    temp_ids.push(temp_id);
    initMessage.temp_id = temp_id;
    new User(temp_id);
  }
  sendMessage(initMessage);
};

socket.onmessage = function(messageEvent) {
  var parsed;
  try {
    parsed = JSON.parse(messageEvent.data);
  } catch (e) {
    parsed = null;
  }
  if(parsed) {
    var user;
    if(parsed.type === 'init' && (user = User.getUserById(parsed.data.id))) {
      //console.log(user);

    } else if (parsed.type === 'init' && (user = User.getUserById(temp_ids.pop()))) {
      // swap out temp id from User 'list'
      delete User.users[user.id];
      user.id = parsed.data.id;
      User.users[user.id] = user;

      playerBoard.addPlayer(user);
      activePlayer = user;
      playerBoard.redraw();

    } else if (parsed.type === 'update') {
      parsed.objects.forEach(function(elem) {
        var player;
        if(elem.id in playerBoard.players) {
          player = playerBoard.players[elem.id];

        } else {
          player = new User(elem.id);
          playerBoard.addPlayer(player);
        }
        if('position' in elem) {
          player.changePosition([elem.position.x, elem.position.y]);

        } else if ('deleted' in elem) {
          console.log(playerBoard)
          console.log(player)
          playerBoard.removePlayer(player);
        }

        playerBoard.redraw();
      });
    }

  } else {
    console.log("bad message: " + messageEvent.data);
  }
};

socket.onclose = function(e) {
  console.log('server connection closed...');
};

socket.onerror = function(e) {
  console.log('error: ');
  console.log(e);
}

var text_element = document.getElementById('output');
var canvas_element = document.getElementById('canvas-element');
var parentDims = canvas_element.parentElement.getBoundingClientRect()
var playerBoard = new Board(canvas_element, parentDims.width, parentDims.height);

var activePlayer = null;
document.onkeydown = function(key_event) {
  var keyCode = key_event.keyCode;
  if(keyCode === 37) {
    // left
    playerBoard.movePlayerTo(activePlayer, [-10, 0], false);
  } else if(keyCode === 38) {
    // up
    playerBoard.movePlayerTo(activePlayer, [0, -10], false);
  } else if(keyCode === 39) {
    // right
    playerBoard.movePlayerTo(activePlayer, [10, 0], false);
  } else if(keyCode === 40) {
    // down
    playerBoard.movePlayerTo(activePlayer, [0, 10], false);
  }
};

window.addEventListener("deviceorientation", function(orientation_event) {
  //text_element.textContent = [orientation_event.alpha, orientation_event.beta, orientation_event.gamma].join(', ');
  var vals = [Math.round(orientation_event.gamma*10)/50, Math.round(orientation_event.beta*10)/50];
  text_element.textContent = vals;
  playerBoard.movePlayerTo(activePlayer, vals, false);
}, true);
