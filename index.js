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
    color: getRndColor(),
    position: getRndPosition(),
  }

  users[socket.id] = user

  socket.on('disconnect', function(){
    delete users[socket.id]
  });


  console.log(users)

}




function getRndInt(min,max) {

  return Math.floor(Math.random() * (max - min) ) + min;

}


function getRndColor() {

  const colors = ['blue','red','green','violet','yellow']

  const indx = getRndInt(0, colors.length)

  return colors[indx]

}



function  getRndPosition(){

  const x = getRndInt(0,1000)


  const y = getRndInt(0,1000)

  return {x,y}

}

