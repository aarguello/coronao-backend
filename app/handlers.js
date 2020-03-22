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
  global.positions[[user.position.x, user.position.y]] = user._id

  // Set up handlers
  socket.on('USER_MOVE_LEFT',  module.exports.userMoveLeft.bind(this, user))
  socket.on('USER_MOVE_RIGHT', module.exports.userMoveRight.bind(this, user))
  socket.on('USER_MOVE_UP',    module.exports.userMoveUp.bind(this, user))
  socket.on('USER_MOVE_DOWN',  module.exports.userMoveDown.bind(this, user))
  socket.on('USER_ATTACK',     module.exports.userAttack.bind(this, user))

  socket.on('disconnect', () => {
    delete global.positions[[user.position.x, user.position.y]]
    delete global.users[socket.id]
  })
}

module.exports.userMoveLeft = (user) => {

  user.direction = 'LEFT'

  if (user.position.x > 0 && !utils.getNeighbourUserId(user)) {
    delete global.positions[[user.position.x, user.position.y]]
    user.position.x--
    global.positions[[user.position.x, user.position.y]] = user._id
  }

  emitters.userPositionChange(user)
}

module.exports.userMoveRight = (user) => {

  user.direction = 'RIGHT'

  if (user.position.x < global.mapSize - 1 && !utils.getNeighbourUserId(user)) {
    delete global.positions[[user.position.x, user.position.y]]
    user.position.x++
    global.positions[[user.position.x, user.position.y]] = user._id
  }

  emitters.userPositionChange(user)
}

module.exports.userMoveUp = (user) => {

  user.direction = 'UP'

  if (user.position.y > 0 && !utils.getNeighbourUserId(user)) {
    delete global.positions[[user.position.x, user.position.y]]
    user.position.y--
    global.positions[[user.position.x, user.position.y]] = user._id
  }

  emitters.userPositionChange(user)
}

module.exports.userMoveDown = (user) => {

  user.direction = 'DOWN'

  if (user.position.y < global.mapSize - 1 && !utils.getNeighbourUserId(user)) {
    delete global.positions[[user.position.x, user.position.y]]
    user.position.y++
    global.positions[[user.position.x, user.position.y]] = user._id
  }

  emitters.userPositionChange(user)
}

module.exports.userAttack = (user) => {

  const victimId = utils.getNeighbourUserId(user)

  if (victimId) {

    const victim = global.users[victimId]
    victim.HP   -= global.attackDamage

    if (victim.HP < 0) {
      victim.HP = 0
    }

    emitters.userApplyDamage(victim)
  }
}