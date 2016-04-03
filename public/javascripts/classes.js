var Board = class Board {
  constructor(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.playerRadius = 20;
    this.rendering = false;

    this.players = {};
    this.obstacles = [];

    window.onresize = function(_this) {
      return function(e) {
        var box = _this.canvas.parentElement.getBoundingClientRect();
        _this.width = box.width;
        _this.height = box.height;
        _this.canvas.width = box.width;
        _this.canvas.height = box.height;
        window.requestAnimationFrame(_this.redraw.bind(_this));
      };
    }(this);
  }

  redraw() {
    var ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = 'black';
    var players = this.players;
    var done = Object.keys(players).reduce(function(prev, player_id, i, arr) {
      var player = players[player_id];
      var dist = player.draw(ctx);
      return dist < 1.0 && prev;
    }, true);

    this.obstacles.forEach(function(obstacle, i, arr) {
      var pos = obstacle.draw(ctx);
      if(pos[0] < 0) {
        obstacle.draw(ctx, true);
        this.obstacles.splice(i, 1);
      }
    });
    if(!done || this.obstacles.length > 0) {
      window.requestAnimationFrame(this.redraw.bind(this));
    }
  }

  addPlayer(player) {
    // for now make last-added player default
    this.players[player.id] = player;
  }

  removePlayer(player) {
    console.log('deleted');
    if(player.id in this.players) {
      delete this.players[player.id];
      return true;
    }
    return false;
  }

  movePlayerTo(player, position, absolute) {
    var curx = player.position.x;
    var cury = player.position.y;
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

var Obstacle = class Obstacle {
  constructor(initx, inity, radius, fillStyle) {
    this.position = {'x': initx, 'y': inity};
    this.radius = radius;
    this.fillStyle = fillStyle || 'green';
    this.path = Obstacle.createPath(initx, inity);
  }

  draw(ctx, cancel) {
    var n = this.path.next(cancel);
    if(!n) {
      return;
    }
    var pos = n.value;

    var x = pos[0],
        y = pos[1];
    
    this.position.x = x;
    this.position.y = y;

    ctx.fillStyle = this.fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, this.radius, 0, 2*Math.PI);
    ctx.fill();

    return pos;
  }
}

Obstacle.createPath = function* (xinit, yinit){
  var ti = Date.now();
  var amp = Math.random()*10,
      freq = Math.random()/100,
      shft = Math.random()*10 - 5;

  var func = function(ti) {
    return [xinit-ti/100, yinit+(amp*Math.sin(freq*ti) + shft)];
  }
  while(true) {
    var relt = Date.now() - ti;
    var cancel = yield func(relt);
    if(cancel) {
      break;
    }
  }
}

var Player = class Player {
  constructor(id) {
    this.id = id;
    this.ready = false;
    Player.players[this.id] = this;
    this.position = {
      x: 0,
      y: 0,
      tarx: 0,
      tary: 0
    }
    this.radius = 20;
    this.maxFrequency = 50; // ms
    this.lastUpdateRequestedAt = 0;
    this.pendingUpdateRequest = null;
  }

  draw(ctx) {
    if(this === activePlayer) {
      ctx.fillStyle = 'black';
    } else {
      ctx.fillStyle = 'darkgrey';
    }

    var x = this.position.x;
    var y = this.position.y;

    ctx.beginPath();
    ctx.arc(x, y, this.radius, 0, 2*Math.PI);
    ctx.fill();

    var delx = this.position.tarx - this.position.x;
    var dely = this.position.tary - this.position.y;

    this.position.x += delx/2;
    this.position.y += dely/2;

    return Math.sqrt(Math.pow(delx, 2) + Math.pow(dely, 2));
  }

  distanceToTarget() {
    return Math.sqrt(Math.pow(this.position.x-this.position.tarx, 2) + Math.pow(this.position.y-this.position.tary, 2));
  }

  submitPositionChange(position) {
    // limit update requests to 'maxFrequency' ms
    var delay = Math.max(this.lastUpdateRequestedAt + this.maxFrequency - Date.now(), 0);

    clearTimeout(this.pendingUpdateRequest);
    this.pendingUpdateRequest = function(_this) {
      return setTimeout(function() {
        _this.lastUpdateRequestedAt = Date.now();
        sendMessage({'id' : _this.id, 'type' : 'update', 'position' : {'x':position[0], 'y':position[1]}});
      }, delay);
    }(this);
  }

  changePosition(position) {
    //console.log("new position: " + position.join(", "));
    this.position.tarx = Number(position[0]);
    this.position.tary = Number(position[1]);
  }

  static generateRandomId() {
    return Math.round(Math.random()*100);
  }

  static getPlayerById(id) {
    if(id in Player.players) {
      return Player.players[id];
    } else {
      return null;
    }
  }
}

Player.players = {};
