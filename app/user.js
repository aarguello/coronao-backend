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

  emitters.userWelcome(user)
  emitters.userJoined(user, socket)

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

  const user     = global.users[this.id]
  const victimId = utils.getNeighbourUserId(user)

  if (!victimId || user.HP === 0 || user.stamina < global.staminaRequired) {
    return
  }

  const victim = global.users[victimId]

  if (victim.HP > 0) {

    const userDamange     = getUserPhysicalDamage(user)
    const victimDefense   = getUserPhysicalDefense(victim)
    const inflictedDamage = global.baseDamage + userDamange - victimDefense

    user.stamina -= global.staminaRequired
    emitters.userAttacked(user._id, inflictedDamage)
    emitters.userStaminaChange(user._id, user.stamina)

    if (inflictedDamage > 0) {

      if (victim.HP - inflictedDamage > 0) {
        victim.HP -= inflictedDamage
      } else {
        victim.HP = 0
      }

      emitters.userApplyDamage(victim._id, victim.HP, inflictedDamage)

      if (victim.HP === 0) {
        killUser(victim)
      }
    }
  }
}

function getUserPhysicalDamage(user) {
  return userPhysicalAttributesCumulator(user, 'physical_damage')
}

function getUserPhysicalDefense(user) {
  return userPhysicalAttributesCumulator(user, 'physical_defense')
}

function userPhysicalAttributesCumulator(user, attribute) {

  const reducer = (total, itemId) => {

    let item = global.items[itemId]
    let value = 0

    if (item[attribute]) {
      value = utils.getRandomInt(
        item[attribute][0],
        item[attribute][1] + 1
      )
    }

    return total + value
  }

  return user.equipement.reduce(reducer, 0)
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

function killUser(user) {
  user.HP = 0
  user.stamina = 0
  user.equipement = []
  emitters.userDied(user._id)
}