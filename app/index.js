const express  = require('express')
const app      = express();
const server   = require('http').createServer(app)
const io       = require('socket.io')(server, {pingInterval: 3000})
const user     = require('./user')

app.use(express.static('app/public'))

server.listen(3000, () => {
  console.log('Listening on port 3000')
})

require('./utils').initGlobals(io)
require('./npc').init()

io.on('connection', user.create)
io.origins((origin, callback) => {
  callback(null, true)
})
