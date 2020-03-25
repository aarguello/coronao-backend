const User     = require('./user')
const Map      = require('./map')
const emitters = require('./emitters')
const items    = require('./items')
const combat   = require('./combat')

module.exports.login  = login
module.exports.logout = logout

function login(name) {

  if (this.id in global.users) {
    return
  }

  const user = new User(this.id, name)

  this.on('USER_MOVE',       (direction) => user.move(direction))
  this.on('USER_SPEAK',      (message) => user.speak(message))
  this.on('USER_ATTACK',     combat.handleBlow)
  this.on('USER_CAST_SPELL', combat.handleSpell)
  this.on('USER_EQUIP_ITEM', items.equipItem)

  global.users[user._id] = user

  const initialPosition = Map.getRandomPosition()
  Map.moveActor('USER', user._id, initialPosition)

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
