const utils    = require('./utils')
const emitters = require('./emitters')

module.exports.newConnection = (socket) => {

  const user = {
    _id: socket.id,
    HP: 100,
    color: utils.getRandomColor(),
    position: utils.getRandomPosition(),
    direction: 'DOWN',
  }

  global.users[socket.id] = user

  // Set up handlers
  socket.on('USER_MOVE_LEFT',  module.exports.userMoveLeft.bind(this, user))
  socket.on('USER_MOVE_RIGHT', module.exports.userMoveRight.bind(this, user))
  socket.on('USER_MOVE_UP',    module.exports.userMoveUp.bind(this, user))
  socket.on('USER_MOVE_DOWN',  module.exports.userMoveDown.bind(this, user))

  socket.on('disconnect', () => {
    delete global.users[socket.id]
  })
}

module.exports.userMoveLeft = (user) => {

  if (user.position.x > 0) {
    user.position.x--
  }

  user.direction = 'LEFT'

  emitters.userPositionChange(user)
}

module.exports.userMoveRight = (user) => {

  if (user.position.x < global.mapSize - 1) {
    user.position.x++
  }

  user.direction = 'RIGHT'

  emitters.userPositionChange(user)
}

module.exports.userMoveUp = (user) => {

  if (user.position.y < global.mapSize - 1) {
    user.position.y++
  }

  user.direction = 'UP'

  emitters.userPositionChange(user)
}

module.exports.userMoveDown = (user) => {

  if (user.position.y > 0) {
    user.position.y--
  }

  user.direction = 'DOWN'

  emitters.userPositionChange(user)
}