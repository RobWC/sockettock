var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	fs = require('fs');

var redis = require("redis");
var client = redis.createClient();
client.select(2);

var port = process.env.C9_PORT || 80;

app.listen(port);

function handler(req, res) {
	fs.readFile(__dirname + '/index.html', function(err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		};
		res.writeHead(200);
		res.end(data);
	});
};

io.enable('browser client minification');
io.enable('browser client etag');

io.configure('development', function(){
  io.set('transports', ['websocket']);
});

io.sockets.on('connection', function(socket) {
  client.incr('counter');
  socket.on('clientnews', function(data) {
    client.incr('clientnewsCtr');
		socket.broadcast.emit('news', {headline: socket.name + ' ' + data.headline});
    client.lpush('clientmgs', data.headline);
	});
  socket.on('setname', function(data){
    socket.name = data.name;
  });
});