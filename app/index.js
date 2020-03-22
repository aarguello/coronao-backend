const express = require('express')
const app     = express()
const server  = require('http').createServer(app)
const io      = require('socket.io')(server)
const utils   = require('./utils')
const user    = require('./user')

app.use(express.static('app/public'))

server.listen(3000, () => {
  console.log('Listening on port 3000')
});

utils.initGlobals(io)

io.on('connection', user.create)
io.origins((origin, callback) => {
  callback(null, true)
})
