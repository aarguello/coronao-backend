var express = require('express')
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('frontend'))

http.listen(3000, function(){
  console.log('listening on *:3000');
});
