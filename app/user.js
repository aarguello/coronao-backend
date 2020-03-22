const utils    = require('./utils')
const emitters = require('./emitters')

module.exports.create = create

function create(socket) {

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

  setupHandlers(socket)
  emitters.userJoined(user)

  socket.on('disconnect', () => {
    emitters.userLeft(user._id)
    delete global.positions[user.position]
    delete global.users[socket.id]
  })
}

function setupHandlers(socket) {
  socket.on('USER_MOVE_LEFT',  moveLeft)
  socket.on('USER_MOVE_RIGHT', moveRight)
  socket.on('USER_MOVE_UP',    moveUp)
  socket.on('USER_MOVE_DOWN',  moveDown)
  socket.on('USER_ATTACK',     attack)
}

function moveLeft() {

  const user = global.users[this.id]
  user.direction = 'LEFT'

  if (user.position[0] > 0 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[0]--
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user)
}

function moveRight() {

  const user = global.users[this.id]
  user.direction = 'RIGHT'

  if (user.position[0] < global.mapSize - 1 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[0]++
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user)
}

function moveUp() {

  const user = global.users[this.id]
  user.direction = 'UP'

  if (user.position[1] > 0 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[1]--
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user)
}

function moveDown() {

  const user = global.users[this.id]
  user.direction = 'DOWN'

  if (user.position[1] < global.mapSize - 1 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[1]++
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user)
}

function attack() {

  const user = global.users[this.id]
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