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
    so the account is created at login time with password == username.
  */
  const username = request.body.name || ''
  const password = request.body.name || ''
  const race = request.body.race || ''
  const class_ = request.body.class || ''

  if (!validators.username(username)) {
    return response.status(400).json({ error: 'INVALID_USERNAME' })
  }

  if (!global.races[race]) {
    return response.status(400).json({ error: 'INVALID_RACE' })
  }

  if (!global.classes[class_]) {
    return response.status(400).json({ error: 'INVALID_CLASS' })
  }

  let account = await Account.getByCredentials(username, password)

  if (!account) {
    account = await Account.create(username, password)
  }

  if (global.connectedAccounts.has(account._id)) {
    return response.status(400).json({ error: 'USERNAME_EXISTS' })
  }

  const token = jwt.sign({ _id: account._id, class: class_, race }, process.env.JWT_SECRET)

  response.status(200).json({
    token,
    _id: username,
    gameRoomId: account.gameRoomId,
    items: global.items,
    spells: global.spells,
    intervals: global.intervals,
    inventorySize: global.config.user.inventorySize,
  })
}

function handleConnection(socket) {
  findGameRoom.call(socket)
  global.connectedAccounts.add(socket.decoded_token._id)
  socket.on('disconnect', leaveGameRoom)
}

async function findGameRoom() {

  const account = await Account.getById(this.decoded_token._id)

  const room = GameRoom.getOrCreate()
  const player = new Player(
    account.username,
    global.races[this.decoded_token.race],
    global.classes[this.decoded_token.class],
    global.config.user,
  )

  room.addPlayer(account._id, player)
  room.addSocket(account._id, this)

  account.setRoom(room._id)
  broadcast.userWelcome(this.id, room, player._id)
  broadcast.userJoined(this, room._id, player)
}

async function leaveGameRoom() {

  const accountId = this.decoded_token._id
  const room = global.gameRooms[0]

  if (!room) {
    return
  }

  const playerId = room.players[accountId]._id

  room.removePlayer(accountId)
  global.connectedAccounts.delete(accountId)
  broadcast.userLeft(this, room._id, playerId)
}