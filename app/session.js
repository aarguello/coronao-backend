const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const socketIoJWT = require('socketio-jwt')
const store = require('./store')
const validators = require('./validators')

module.exports.init = init
module.exports.login = login
module.exports.register = register

function init(io) {

  const JWT = socketIoJWT.authorize({
    secret: process.env.JWT_SECRET,
    handshake: true,
  })

  io.origins((_, callback) => { callback(null, true) })
  io.use(JWT)
  io.on('connection', handleConnection)
}

async function register(request, response) {

  const username = request.body.username
  const password = request.body.password

  if (!validators.username(username)) {
    return response.status(400).json({ error: 'INVALID_USERNAME' })
  }

  if (!validators.password(password)) {
    return response.status(400).json({ error: 'INVALID_PASSWORD' })
  }

  if (await store.users.findOne({ username })) {
    return response.status(400).json({ error: 'USERNAME_EXISTS' })
  }

  try {

    const insert = await store.users.insertOne({
      username,
      password: await bcrypt.hash(password, 10),
    })

    response.status(200).send({ _id: insert.insertedId })

  } catch (err) {
    response.send({ error: 'UNEXPECTED_ERROR' })
  }
}

async function login(request, response) {

  const username = request.body.username || ''
  const password = request.body.password || ''

  const user = await store.users.findOne({ username })

  if (!user) {
    return response.status(400).json({ error: 'INVALID_USERNAME' })
  }

  const match = await bcrypt.compare(password, user.password)

  if (!match) {
    return response.status(400).json({ error: 'INVALID_PASSWORD' })
  }

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET)

  response.status(200).json({
    token,
    _id: user._id,
    items: global.items,
    spells: global.spells,
    mapSize: global.map.size,
    intervals: global.intervals,
    inventorySize: global.config.user.inventorySize,
  })
}

function handleConnection(socket) {
  socket.on('FIND_GAME_ROOM', findGameRoom)
  socket.on('REJOIN_GAME_ROOM', rejoinGameRoom)
  socket.on('disconnect', leaveGameRoom)
}

async function findGameRoom(race = 'HUMAN', class_ = 'BARD') {

}

async function rejoinGameRoom() {

}

async function leaveGameRoom() {

}