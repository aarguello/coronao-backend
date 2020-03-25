const user     = require('./user')
const emitters = require('./emitters')
const items    = require('./items')
const spells   = require('./spells')

module.exports.login  = login
module.exports.logout = logout

function login(name) {

  if (this.id in global.users) {
    return
  }

  const newUser = user.create(this.id, name)

  this.on('USER_MOVE',       user.move)
  this.on('USER_SPEAK',      user.speak)
  this.on('USER_ATTACK',     user.attack)
  this.on('USER_EQUIP_ITEM', items.equipItem)
  this.on('USER_CAST_SPELL', spells.handleSpell)

  emitters.userWelcome(newUser)
  emitters.userJoined(newUser, this)
}

function logout() {
  if (this.id in global.users) {
    user.destroy(this.id)
  }
}
