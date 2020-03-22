
module.exports.userPositionChange = (user) => {

  const _id = user._id
  const position = user.position
  const direction = user.direction

  global.io.emit('USER_POSITION_CHANGE', {
    _id,
    position,
    direction,
  })
}