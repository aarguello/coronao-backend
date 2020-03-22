const utils    = require('./utils')
const emitters = require('./emitters')

module.exports.newConnection = (socket) => {

  const user = {
    _id: socket.id,
    HP: 100,
    color: utils.getRandomColor(),
    position: utils.getRandomPosition(),
    direction: 'DOWN',
    stamina: 100,

  }

  global.users[socket.id] = user
  global.positions[user.position] = user._id

  // Set up handlers
  socket.on('USER_MOVE_LEFT',  module.exports.userMoveLeft.bind(this, user))
  socket.on('USER_MOVE_RIGHT', module.exports.userMoveRight.bind(this, user))
  socket.on('USER_MOVE_UP',    module.exports.userMoveUp.bind(this, user))
  socket.on('USER_MOVE_DOWN',  module.exports.userMoveDown.bind(this, user))
  socket.on('USER_ATTACK',     module.exports.userAttack.bind(this, user))

  socket.on('disconnect', () => {
    delete global.positions[user.position]
    delete global.users[socket.id]
  })
}

module.exports.userMoveLeft = (user) => {

  user.direction = 'LEFT'

  if (user.position[0] > 0 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[0]--
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user)
}

module.exports.userMoveRight = (user) => {

  user.direction = 'RIGHT'

  if (user.position[0] < global.mapSize - 1 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[0]++
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user)
}

module.exports.userMoveUp = (user) => {

  user.direction = 'UP'

  if (user.position[1] > 0 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[1]--
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user)
}

module.exports.userMoveDown = (user) => {

  user.direction = 'DOWN'

  if (user.position[1] < global.mapSize - 1 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[1]++
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user)
}

module.exports.userAttack = (user) => {

  const victimId = utils.getNeighbourUserId(user)

  if (victimId && user.stamina >= 25) {


    user.stamina -= global.staminaRequired
    const victim = global.users[victimId]
    victim.HP   -= global.attackDamage

    if (victim.HP < 0) {
      victim.HP = 0
    }

    emitters.userApplyDamage(victim)
    emitters.userStaminaChange(user)

  }
}