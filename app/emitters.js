
module.exports.userJoined = (user) => {
  global.io.emit('USER_JOINED', user)
}

module.exports.userLeft = (userId) => {
  global.io.emit('USER_LEFT', userId)
}

module.exports.userPositionChange = (user) => {

  const _id       = user._id
  const position  = user.position
  const direction = user.direction

  global.io.emit('USER_POSITION_CHANGE', {
    _id,
    position,
    direction,
  })
}

module.exports.userApplyDamage = (user) => {

  const _id = user._id
  const HP  = user.HP

  global.io.emit('USER_APPLY_DAMAGE', {
    _id,
    HP,
  })
}

module.exports.userStaminaChange = (user) => {

  const _id     = user._id
  const stamina = user.stamina

  global.io.to(user._id).emit('USER_STAMINA_CHANGE', {
    _id,
    stamina,
  })
}

module.exports.userEquipedItem = (userId, itemId) => {
  global.io.emit('USER_EQUIPED_ITEM', userId, itemId)
}

module.exports.userUnequipedItem = (userId, itemId) => {
  global.io.emit('USER_UNEQUIPED_ITEM', userId, itemId)
}