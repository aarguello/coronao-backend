
module.exports.userWelcome = (user) => {

  const globals = {
    users: global.users,
    items: global.items,
    mapSize: global.mapSize,
    inventorySize :global.inventorySize,
  }

  global.io.to(user._id).emit('USER_WELCOME', { user, globals })
}

module.exports.userJoined = (user, socket) => {
  socket.broadcast.emit('USER_JOINED', user)
}

module.exports.userLeft = (_id) => {
  global.io.emit('USER_LEFT', { _id })
}

module.exports.userPositionChanged = (_id, position) => {
  global.io.emit('USER_POSITION_CHANGE', { _id, position })
}

module.exports.userDirectionChanged = (_id, direction) => {
  global.io.emit('USER_DIRECTION_CHANGED', { _id, direction })
}

module.exports.userAttacked = (_id, damage) => {
  global.io.emit('USER_ATTACKED', { user: { _id }, damage })
}

module.exports.userReceivedSpell = (_id, spellId) => {
  global.io.emit('USER_RECEIVED_SPELL', { user: { _id }, spellId })
}

module.exports.userHPChanged = (_id, HP) => {
  global.io.emit('USER_HP_CHANGED', { _id, HP })
}

module.exports.userManaChanged = (_id, mana) => {
  global.io.to(_id).emit('USER_MANA_CHANGED', { _id, mana })
}

module.exports.userStaminaChanged = (_id, stamina) => {
  global.io.to(_id).emit('USER_STAMINA_CHANGED', { _id, stamina })
}

module.exports.userEquipedItem = (_id, itemId) => {
  global.io.emit('USER_EQUIPED_ITEM', { user: { _id }, itemId })
}

module.exports.userUnequipedItem = (_id, itemId) => {
  global.io.emit('USER_UNEQUIPED_ITEM', { user: { _id }, itemId })
}

module.exports.userDied = (_id) => {
  global.io.emit('USER_DIED', { _id })
}

module.exports.userRevived = (_id) => {
  global.io.emit('USER_REVIVED', { _id })
}

module.exports.userSpoke = (_id, message) => {
  global.io.emit('USER_SPOKE', { user: { _id }, message})
}
