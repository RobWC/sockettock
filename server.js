var app = require('express').createServer(),
	io = require('socket.io').listen(app);

var parseCookie = require('connect').utils.parseCookie;

var express = require('express');

var RedisStore = require('connect-redis')(express);

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "cougar show", store: new RedisStore }));
});

//configure redis
var redis = require("redis");
var client = redis.createClient();
client.select(2);

var port = process.env.C9_PORT || 80;

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.listen(port);

io.enable('browser client minification');
io.enable('browser client etag');

io.configure('development', function(){
  io.set('transports', ['websocket']);
  io.set('authorization', function (handshakeData, callback) {
    // check if there's a cookie header
    if (handshakeData.headers.cookie) {
        // if there is, parse the cookie
        handshakeData.cookie = parseCookie(handshakeData.headers.cookie);
        // note that you will need to use the same key to grad the
        // session id, as you specified in the Express setup.
        handshakeData.sessionID = handshakeData.cookie['connect.sid'];
        RedisStore.get(handshakeData.sessionID, function (err, session) {
            if (err || !session) {
                // if we cannot grab a session, turn down the connection
                callback('Error', false);
            } else {
                // save the session data and accept the connection
                handshakeData.session = session;
                callback(null, true);
            }
        });
    } else {
       // if there isn't, turn down the connection with a message
       // and leave the function.
       return callback('No cookie transmitted.', false);
    }
    // accept the incoming connection
    callback(null, true);
  });
});

io.sockets.on('connection', function(socket) {
  client.incr('counter');
  socket.on('clientnews', function(data) {
    socket.get('name', function (err, name) {
      console.log('Cookie Data ' +  socket.handshake.sessionID);
      client.incr('clientnewsCtr');
  	  socket.broadcast.emit('news', {headline: name + ' ' + data.headline + ' add ' + socket.handshake.sessionID });
      client.lpush('clientmgs', data.headline);
    });
	});
  socket.on('setname', function(data){
     socket.set('name', escape(data.name), function () {
      socket.broadcast.emit('news', {headline: 'User ' + data.name + ' has joined'})
      socket.emit('ready');
    });
  });
});