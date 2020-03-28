const express  = require('express')
const app      = express();
const server   = require('http').createServer(app)
const io       = require('socket.io')(server, {pingInterval: 3000})
const session  = require('./session')

app.use(express.static('app/public'))

server.listen(3000, () => {
  console.log('Listening on port 3000')
})

require('./emitters').setIO(io)
require('./utils').initGlobals()
require('./npc').init()

io.on('connection', registerBaseHandlers)

io.origins((origin, callback) => {
  callback(null, true)
})

function registerBaseHandlers(socket) {
  socket.on('USER_LOGIN', session.login)
  socket.on('disconnect', session.logout)
}