const express     = require('express')
const bodyParser  = require('body-parser')
const cors        = require('cors')
const socketIo    = require('socket.io')
const socketIoJWT = require('socketio-jwt')
const session     = require('./session')
const store       = require('./store')

const app    = express()
const server = require('http').createServer(app)
const io     = socketIo(server, { pingInterval: 3000 })

app.use(express.static('app/public'))
app.use(cors())
app.use(bodyParser.json())
app.post('/login', session.login)

store.init().then(() => {
  server.listen(3000)
})

io.origins((origin, callback) => { callback(null, true) })
io.use(socketIoJWT.authorize({ secret: process.env.JWT_SECRET, handshake: true }))
io.on('connection', session.connection)

require('./emitters').setIO(io)
require('./utils').initGlobals()
require('./npc').init()