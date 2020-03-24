const utils    = require('./utils')
const emitters = require('./emitters')
const items    = require('./items')
const spells   = require('./spells')

module.exports.create        = create
module.exports.inflictDamage = inflictDamage

function create(socket) {

  const userClass = utils.getRandomClass()
  const userRace  = utils.getRandomRace()

  const user = {
    _id: socket.id,
    class: userClass.name,
    race: userRace.name,
    position: utils.getRandomPosition(),
    direction: 'DOWN',
    inventory: {},
    equipement: [],
    spells: [],
    max_HP: userClass.HP + userRace.HP,
    max_mana: userClass.mana + userRace.mana,
    max_stamina: userClass.stamina
  }

  user.HP = user.max_HP
  user.mana = user.max_mana
  user.stamina = user.max_stamina

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
  socket.on('USER_EQUIP_ITEM', items.equipItem)
  socket.on('USER_SPEAK',      speak)
  socket.on('USER_CAST_SPELL', spells.handleSpell)
}

function moveLeft() {

  const user = global.users[this.id]
  user.direction = 'LEFT'

  if (user.position[0] > 0 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[0]--
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user._id, user.position, user.direction)
}

function moveRight() {

  const user = global.users[this.id]
  user.direction = 'RIGHT'

  if (user.position[0] < global.mapSize - 1 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[0]++
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user._id, user.position, user.direction)
}

function moveUp() {

  const user = global.users[this.id]
  user.direction = 'UP'

  if (user.position[1] > 0 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[1]--
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user._id, user.position, user.direction)
}

function moveDown() {

  const user = global.users[this.id]
  user.direction = 'DOWN'

  if (user.position[1] < global.mapSize - 1 && !utils.getNeighbourUserId(user)) {
    delete global.positions[user.position]
    user.position[1]++
    global.positions[user.position] = user._id
  }

  emitters.userPositionChange(user._id, user.position, user.direction)
}

function attack() {

  const user     = global.users[this.id]
  const victimId = utils.getNeighbourUserId(user)

  if (!victimId || user.HP === 0 || user.stamina < global.staminaRequired) {
    return
  }

  const victim = global.users[victimId]

  if (victim.HP > 0) {

    const userDamage      = getUserPhysicalDamage(user)
    const victimDefense   = getUserPhysicalDefense(victim)
    const inflictedDamage = Math.round(userDamage - victimDefense)

    user.stamina -= global.staminaRequired
    emitters.userAttacked(user._id, inflictedDamage)
    emitters.userStaminaChange(user._id, user.stamina)

    inflictDamage(victim, inflictedDamage)
  }
}

function getUserPhysicalDamage(user) {

  const classDamage = global.classes[user.class].physical_damage
  const itemsDamage = items.getEquipementBonus(user, 'physical_damage')

  return global.baseDamage * classDamage + itemsDamage
}

function getUserPhysicalDefense(user) {
  return items.getEquipementBonus(user, 'physical_defense')
}

function inflictDamage(target, damage) {

  if (damage <= 0) {
    return
  }

  if (target.HP - damage > 0) {
    target.HP -= damage
  } else {
    target.HP = 0
  }

  emitters.userApplyDamage(target._id, target.HP, damage)

  if (target.HP === 0) {
    killUser(target)
  }
}

function killUser(user) {
  user.HP = 0
  user.stamina = 0
  user.equipement = []
  emitters.userDied(user._id)
}

function speak(message) {

  if (message.length > global.messageMaxLength) {
    message = message.slice(0, global.messageMaxLength) + '...'
  }

  emitters.userSpoke(this.id, message)
}