var WebSocketServer = require('ws').Server;
var util = require('util'); // util.inspect
var redis = require('redis');
var shortid = require('shortid');
var User = require('./models/user');

var redis_client = redis.createClient();

var clients = {};
var sockets = {};

var keyFromValue = function(obj, value) {
  for(var prop in obj) {
    if(obj[prop] === value) {
      return prop;
    };
  }
  return null;
};

var connectionListener = function(ws) {
  var sockid = shortid.generate();
  sockets[sockid] = ws; 
  clients[sockid] = {};

  broadcast({'type': 'message', 'data' : 'now ' + Object.keys(clients).length + ' clients'}, []);

  ws.on('message', function(message) {
    try {
      var parsed = JSON.parse(message);
    } catch (e) {
      console.log('not json');
      console.log('message: ' + message);
      return;
    }
    handleMessage(sockid, parsed).then(function(result) {
      ws.send(JSON.stringify(result));

    }).catch(function(err) {
      ws.send(JSON.stringify({'type': 'error', 'data':err.message}));

    });
  });

  ws.on('close', function() {
    console.log('close, removing client...');

    var objects = Object.keys(clients[sockid]).map(function(elem) {
      return {id: elem, 'deleted': true};
    });

    delete sockets[sockid]
    delete clients[sockid]

    broadcast({'type' : 'update', 'objects' : objects}, []);
  });
};

var broadcast = function(message, except) {
  for(var sock_id in sockets) {
    if(except.indexOf(sock_id) < 0) {
      sockets[sock_id].send(JSON.stringify(message));
    }
  }
};

var handleMessage = function(ws_id, object) {
  if(object.type == 'init' && object.id) {
    return User.findById(object.id).then(function(result) {
      if(result) {
        clients[ws_id][result._id] = result;
        return {
          'type': 'init',
          'data' : {
            'id' : result._id,
            'username' : result.username
          }
        };
      }
    });
  } else if (object.type == 'update') {
    // add current_position
    redis_client.hmset(object.id, object.position);

    // get all object positions
    var positions = Object.keys(clients).reduce(function(previous_val, sock_id) {
      // elem = socket_id
      var users = clients[sock_id];
      return previous_val.concat(Object.keys(users).map(function(user_id) {
        return new Promise(function(resolve, reject) {
          redis_client.hgetall(user_id, function(err, object) {
            if(err) {
              return reject(err);
            }
            return resolve({'id': user_id, 'position' : object});
          });
        }).then(function(ob) {
          return User.findById(ob.id).then(function(result) {
            ob.username = result.username;
            return ob;
          });
        });
      }));
    }, []);
    return Promise.all(positions).then(function(results) {
      broadcast({'type' : 'update', 'objects' : results}, [object.id]);
      return {};

    }).catch(function(err) {
      console.log(err);
    });

  } else {
    // unknown
    return Promise.reject('invalid object');
  }
};

module.exports = function(server) {
  var wss = new WebSocketServer({
    server: server,
    path: '/sockets'
  });

  wss.on('connection', connectionListener);
};
