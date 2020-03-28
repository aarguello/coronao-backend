const User      = require('./user')
const Map       = require('./map')
const broadcast = require('./emitters')
const combat    = require('./combat')
const utils     = require('./utils')

module.exports.login  = signUp
module.exports.logout = logout

function signUp(name) {

  const idTaken   = this.id in global.users
  const nameTaken = Object.keys(global.users).find(u => u.name === name)

  if (idTaken || nameTaken) {
    return
  }

  const user = new User(
    this.id,
    name,
    utils.getRandomRace(),
    utils.getRandomClass(),
  )

  global.users[user._id] = user
  Map.updateActorPosition(user, Map.getRandomPosition())

  registerSocketHandlers(this, user)
  registerEventsBroadcast(user)

  broadcast.userWelcome(user)
  broadcast.userJoined(user, this)
}

function registerSocketHandlers(socket, user) {
  socket.on('USER_MOVE',        (direction) => user.move(direction))
  socket.on('USER_SPEAK',       (message)   => user.speak(message))
  socket.on('USER_MEDITATE',    ()          => user.meditate())
  socket.on('USER_TOGGLE_ITEM', (itemId)    => user.toggleItem(itemId))
  socket.on('USER_ATTACK',      combat.handleBlow)
  socket.on('USER_CAST_SPELL',  combat.handleSpell)
}

function registerEventsBroadcast(user) {
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

function logout() {

  const user = global.users[this.id]

  if (user) {
    delete global.map.positions[user.position].USER
    delete global.users[this.id]
    broadcast.userLeft(this.id)
  }
}
