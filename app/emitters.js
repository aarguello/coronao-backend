
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