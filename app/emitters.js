
module.exports.userPositionChange = (user) => {

  const _id = user._id
  const position = user.position

  global.io.emit('USER_POSITION_CHANGE', {
    _id,
    position,
  })
}