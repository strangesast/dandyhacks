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
    for(var player_id in this.players) {
      var player = this.players[player_id];
      player.draw(ctx, this.playerRadius)
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
    this.maxFrequency = 100; // ms
    this.lastUpdateRequestedAt = 0;
    this.pendingUpdateRequest = null;
  }

  draw(ctx, radius) {
    if(this === activePlayer) {
      ctx.fillStyle = 'black';
    } else {
      ctx.fillStyle = 'darkgrey';
    }
    var x = this.position.x;
    var y = this.position.y;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2*Math.PI);
    ctx.fill()
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
    console.log("actual: " + position);
    //console.log("new position: " + position.join(", "));
    this.position.x = Number(position[0]);
    this.position.y = Number(position[1]);
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
