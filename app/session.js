const jwt       = require('jsonwebtoken')
const User      = require('./user')
const Map       = require('./map')
const broadcast = require('./emitters')
const combat    = require('./combat')

module.exports.login      = login
module.exports.connection = connection

function login(request, response) {

  const name   = request.body.name
  const race   = request.body.race  || 'HUMAN'
  const class_ = request.body.class || 'BARD'

  if (!name || name in global.users) {
    response.status(400)
    response.send({ error: 'USERNAME_TAKEN' })
    return
  }

  if (!global.races[race]) {
    response.status(400)
    response.send({ error: 'RACE_NOT_FOUND' })
    return
  }

  if (!global.classes[class_]) {
    response.status(400)
    response.send({ error: 'CLASS_NOT_FOUND' })
    return
  }

  const payload = {
    name:  name,
    race:  race,
    class: class_,
  }

  response.status(200)
  response.send({
    token:         jwt.sign(payload, process.env.JWT_SECRET),
    items:         global.items,
    spells:        global.spells,
    mapSize:       global.map.size,
    inventorySize: global.inventorySize,
  })
}

function connection(socket) {

  let user = global.users[socket.decoded_token.name]

  if (!user) {

    user = new User(
      socket.decoded_token.name,
      global.races[socket.decoded_token.race],
      global.classes[socket.decoded_token.class]
    )

    global.users[user._id] = user
    Map.updateActorPosition(user, Map.getRandomPosition())
  }

  registerSocketHandlers(socket, user)
  registerEventsBroadcast(user)

  socket.on('disconnect', disconnect)

  broadcast.userWelcome(user, socket)
  broadcast.userJoined(user, socket)
}

function disconnect() {

  const user = global.users[this.decoded_token.name]

  if (user) {
    delete global.map.positions[user.position].USER
    delete global.users[user._id]
    broadcast.userLeft(user._id)
  }
}

function registerSocketHandlers(socket, user) {
  socket.on('USER_MOVE',        (direction) => user.move(direction))
  socket.on('USER_SPEAK',       (message)   => user.speak(message))
  socket.on('USER_MEDITATE',    ()          => user.meditate())
  socket.on('USER_TOGGLE_ITEM', (itemId)    => user.toggleItem(itemId))
  socket.on('USER_ATTACK',      ()          => user.attack())
  socket.on('USER_CAST_SPELL',  combat.handleSpell.bind(user))
}

function registerEventsBroadcast(user) {
  user.on('ATTACKED',           broadcast.userAttacked)
  user.on('SPOKE',              broadcast.userSpoke)
  user.on('DIED',               broadcast.userDied)
  user.on('REVIVED',            broadcast.userRevived)
  user.on('DIRECTION_CHANGED',  broadcast.userDirectionChanged)
  user.on('POSITION_CHANGED',   broadcast.userPositionChanged)
  user.on('VISIBILITY_CHANGED', broadcast.userVisibilityChanged)
  user.on('INVENTORY_CHANGED',  broadcast.userInventoryChanged)
  user.on('STAT_CHANGED',       broadcast.userStatChanged)
  user.on('EQUIPED_ITEM',       broadcast.userEquipedItem)
  user.on('UNEQUIPED_ITEM',     broadcast.userUnequipedItem)
  user.on('STARTED_MEDITATING', broadcast.userStartedMeditating)
  user.on('STOPPED_MEDITATING', broadcast.userStoppedMeditating)
}