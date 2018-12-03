var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// app.get('/', function (req, res) {
//   res.sendFile(__dirname + '/index.html');
// });

app.use(express.static('../docs'))

io.on('connection', function (socket) {
  socket.on('control', function (msg) {
    io.emit('control', msg);
  });
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});