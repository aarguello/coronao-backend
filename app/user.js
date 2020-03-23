const utils    = require('./utils')
const emitters = require('./emitters')

module.exports.create = create

function create(socket) {

  const user = {
    _id: socket.id,
    HP: 100,
    stamina: 100,
    color: utils.getRandomColor(),
    position: utils.getRandomPosition(),
    direction: 'DOWN',
    inventory: {},
    equipement: [],
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
  socket.on('USER_EQUIP_ITEM', equipItem)
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

  if (victimId && user.stamina >= global.staminaRequired) {

    const victim  = global.users[victimId]
    victim.HP    -= global.attackDamage
    user.stamina -= global.staminaRequired

    if (victim.HP < 0) {
      victim.HP = 0
    }

    emitters.userApplyDamage(victim)
    emitters.userStaminaChange(user)
  }
}

function equipItem(itemId) {

  const userId = this.id
  const user   = global.users[userId]
  const item   = global.items[itemId]

  if (!item || !user.inventory[itemId]) {
    return
  }

  if (user.equipement.includes(itemId)) {
    unequipItem(user, itemId)
  } else {

    user.equipement.forEach(id => {
      if (global.items[id].body_part === item.body_part) {
        unequipItem(user, id)
      }
    })

    user.equipement.push(itemId)
    emitters.userEquipedItem(userId, itemId)
  }
}

function unequipItem(user, itemId) {
  const index = user.equipement.indexOf(itemId)
  user.equipement.splice(index, 1)
  emitters.userUnequipedItem(userId, itemId)
}