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
      obstacle.x -= 0.1
      if(obstacle.x < 0) {
        arr.splice(i, 1);
      } else {
        ctx.beginPath()
        ctx.arc(obstacle.x, obstacle.y, 10, 0, Math.PI*2);
        ctx.fill();
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

var Player = class Player {
  constructor(id, username) {
    this.id = id;
    this.username = username || "unknown";
    this.ready = false;
    Player.players[this.id] = this;
    this.position = {
      x: 0,
      y: 0,
      tarx: 0,
      tary: 0
    }
    this.radius = 15;
    this.maxFrequency = 50; // ms
    this.lastUpdateRequestedAt = 0;
    this.pendingUpdateRequest = null;
    this.blobCount = 0;
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

    ctx.font = "10px Verdana";
    ctx.fillText(this.username + " " + this.blobCount, x+2+this.radius, y);

    var delx = this.position.tarx - this.position.x;
    var dely = this.position.tary - this.position.y;

    this.position.x += 2*delx/3;
    this.position.y += 2*dely/3;

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
