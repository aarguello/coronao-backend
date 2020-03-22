const express  = require('express')
const app      = express();
const server   = require('http').createServer(app)
const io       = require('socket.io')(server)
const handlers = require('./handlers')

global.users = {}
global.positions = {}
global.mapSize = 1000
global.io = io
global.attackDamage = 15

app.use(express.static('app/public'))

server.listen(3000, () => {
  console.log('Listening on port 3000')
});

io.on('connection', handlers.newConnection)
