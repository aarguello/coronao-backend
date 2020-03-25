const User     = require('./user')
const emitters = require('./emitters')
const items    = require('./items')
const spells   = require('./spells')
const utils    = require('./utils')

module.exports.login  = login
module.exports.logout = logout

function login(name) {

  if (this.id in global.users) {
    return
  }

  const user = new User(this.id, name)

  this.on('USER_MOVE',       (direction) => user.move(direction))
  this.on('USER_SPEAK',      (message) => user.speak(message))
  this.on('USER_ATTACK',     spells.handleBlow)
  this.on('USER_CAST_SPELL', spells.handleSpell)
  this.on('USER_EQUIP_ITEM', items.equipItem)

  global.users[user._id] = user

  const initialPosition = utils.getRandomPosition()
  utils.moveActor('USER', user._id, initialPosition)

  emitters.userWelcome(user)
  emitters.userJoined(user, this)
}

function logout() {

  const user = global.users[this._id]

  if (user) {
    delete global.map.positions[user.position].USER
    delete global.users[this._id]
    emitters.userLeft(this._id)
  }
}
