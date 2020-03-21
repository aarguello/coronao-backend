var express = require('express')
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('frontend'))

http.listen(3000, function(){
  console.log('listening on *:3000');
});

const users = {};

io.on('connection', handleNewConnection);

function handleNewConnection(socket) {
  
  const user = {
    _id: socket.id,
    HP: 100,
    color: 'blue',
    position: {x: 0, y: 0},
  }

  users[socket.id] = user

  socket.on('disconnect', function(){
    delete users[socket.id]
  });
}