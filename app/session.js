const User      = require('./user')
const Map       = require('./map')
const broadcast = require('./emitters')
const combat    = require('./combat')

module.exports.login  = login
module.exports.logout = logout

function login(name) {

  if (this.id in global.users) {
    return
  }

  const user = new User(this.id, name)

  this.on('USER_MOVE',        (direction) => user.move(direction))
  this.on('USER_SPEAK',       (message)   => user.speak(message))
  this.on('USER_MEDITATE',    ()          => user.meditate())
  this.on('USER_TOGGLE_ITEM', (itemId)    => user.toggleItem(itemId))
  this.on('USER_ATTACK',     combat.handleBlow)
  this.on('USER_CAST_SPELL', combat.handleSpell)

  global.users[user._id] = user
  Map.updateActorPosition(user, Map.getRandomPosition())

  registerEventsBroadcast(user)

  broadcast.userWelcome(user)
  broadcast.userJoined(user, this)
}

function registerEventsBroadcast(user) {
  user.on('SPOKE',              broadcast.userSpoke)
  user.on('DIED',               broadcast.userDied)
  user.on('REVIVED',            broadcast.userRevived)
  user.on('DIRECTION_CHANGED',  broadcast.userDirectionChanged)
  user.on('POSITION_CHANGED',   broadcast.userPositionChanged)
  user.on('VISIBILITY_CHANGED', broadcast.userVisibilityChanged)
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
