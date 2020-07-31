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

  /*
    Heads up! Client-side has not implemented sign-up method yet,
    so the account is created at login time if it doesn't exist (setting password = username)
  */
  const username = request.body.name || ''
  const password = request.body.name || ''
  const race = request.body.race || ''
  const class_ = request.body.class || ''

  if (!validators.username(username)) {
    return response.status(400).json({ error: 'INVALID_USERNAME' })
  }

  if (await Account.getByCredentials(username, password)) {
    return response.status(400).json({ error: 'USERNAME_EXISTS' })
  }

  if (!global.races[race]) {
    return response.status(400).json({ error: 'INVALID_RACE' })
  }

  if (!global.classes[class_]) {
    return response.status(400).json({ error: 'INVALID_CLASS' })
  }

  const account = await Account.create(username, password)
  const token = jwt.sign({ _id: account._id }, process.env.JWT_SECRET)

  response.status(200).json({
    token,
    _id: account._id,
    gameRoomId: account.gameRoomId,
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
  socket.on('LEAVE_GAME_ROOM', leaveGameRoom)
  socket.on('disconnect', disconnect)
}

function disconnect() {
  Account.remove(this.decoded_token._id)
}

async function findGameRoom(race = 'HUMAN', class_ = 'BARD') {

  const account = await Account.getById(this.decoded_token._id)

  if (account.gameRoomId >= 0) {
    return
  }

  const room = GameRoom.getOrCreate(2)
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
    broadcast.gameState(room._id, room.players, {}, {})
  }
}

async function rejoinGameRoom() {

  const account = await Account.getById(this.decoded_token._id)
  const room = global.gameRooms[account.gameRoomId]

  if (room && room.status === 'INGAME') {
    room.addSocket(account._id, this)
    broadcast.gameState(room._id, room.players, {}, {})
  }
}

async function leaveGameRoom() {

  const account = await Account.getById(this.decoded_token._id)
  const room = global.gameRooms[account.gameRoomId]

  if (!room) {
    return
  }

  const player = room.players[account._id]

  if (room.status === 'QUEUE' || room.status === 'INGAME' && player.hp === 0) {
    room.removePlayer(account._id)
    account.unsetRoom()
    broadcast.userLeftGameRoom(account._id, room._id, this.id)
  }
}