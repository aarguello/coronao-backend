const User     = require('./user')
const Map      = require('./map')
const emitters = require('./emitters')
const combat   = require('./combat')

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

  emitters.userWelcome(user)
  emitters.userJoined(user, this)
}

function logout() {

  const user = global.users[this.id]

  if (user) {
    delete global.map.positions[user.position].USER
    delete global.users[this.id]
    emitters.userLeft(this.id)
  }
}
