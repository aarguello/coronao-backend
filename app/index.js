const express     = require('express')
const bodyParser  = require('body-parser')
const cors        = require('cors')
const socketIo    = require('socket.io')
const broadcast   = require('./emitters')
const session     = require('./session')
const store       = require('./store')

const app    = express()
const server = require('http').createServer(app)
const io     = socketIo(server, { pingInterval: 3000 })

app.use(express.static('app/public'))
app.use(cors())
app.use(bodyParser.json())
app.post('/register', session.register)
app.post('/login', session.login)

store.init().then(() => {
  session.init(io)
  server.listen(3000)
})

broadcast.init(io)
require('./utils').initGlobals()
require('./npc').init()