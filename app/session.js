const jwt = require('jsonwebtoken')
const socketIoJWT = require('socketio-jwt')
const validators = require('./validators')
const broadcast = require('./emitters')
const Account = require('./model/account')
const GameRoom = require('./model/game-room')
const Player = require('./model/player')

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

  if (await Account.getByUsername(username)) {
    return response.status(400).json({ error: 'USERNAME_EXISTS' })
  }

  try {
    const account = await Account.create(username, password)
    response.status(200).send({ _id: account._id })
  } catch (err) {
    response.send({ error: 'UNEXPECTED_ERROR' })
  }
}

async function login(request, response) {

  const username = request.body.username || ''
  const password = request.body.password || ''
  const account = await Account.getByCredentials(username, password)

  if (!account) {
    return response.status(400).json({ error: 'INVALID_CREDENTIALS' })
  }

  const token = jwt.sign({ _id: account._id }, process.env.JWT_SECRET)

  response.status(200).json({
    token,
    _id: account._id,
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

  const account = await Account.getById(this.decoded_token._id)

  if (account.gameRoomId >= 0) {
    return
  }

  const room = GameRoom.getOrCreate(3)
  const player = new Player(
    account.username,
    global.races[race],
    global.classes[class_],
    global.config.user,
  )

  room.addPlayer(account._id, player)
  room.addSocket(account._id, this)

  account.setRoom(room._id)
  broadcast.userJoinedGameRoom(account._id, room)

  if (room.capacity === Object.keys(room.players).length) {
    room.startGame()
    broadcast.gameStateNew(room._id, room.players, {}, {})
  }
}

async function rejoinGameRoom() {

}

async function leaveGameRoom() {

}