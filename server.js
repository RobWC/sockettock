var app = require('express').createServer(),
	io = require('socket.io').listen(app);

var express = require('express');

var RedisStore = require('connect-redis')(express);
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: "cougar show", store: new RedisStore }));

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
});

io.sockets.on('connection', function(socket) {
  client.incr('counter');
  socket.on('clientnews', function(data) {
    socket.get('name', function (err, name) {
      client.incr('clientnewsCtr');
  	  socket.broadcast.emit('news', {headline: name + ' ' + data.headline});
      client.lpush('clientmgs', data.headline);
    });
	});
  socket.on('setname', function(data){
     socket.set('name', escape(data.name), function () {
      socket.emit('ready');
    });
  });
});