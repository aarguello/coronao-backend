const utils    = require('./utils')
const emitters = require('./emitters')
const items    = require('./items')
const spells   = require('./spells')

module.exports.create   = create
module.exports.hurt     = hurt
module.exports.heal     = heal
module.exports.freeze   = freeze
module.exports.unfreeze = unfreeze

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
    spells: Object.keys(global.spells),
    max_HP: userClass.HP + userRace.HP,
    max_mana: userClass.mana + userRace.mana,
    max_stamina: userClass.stamina,
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

  setInterval(() => updateUserStamina(user), global.intervals.staminaRecover)


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
  const neighbour = utils.getNeighbourUserId(user)

  if (user.direction != 'LEFT') {
    user.direction = 'LEFT'
    emitters.userDirectionChanged(user._id, user.direction)
  }

  if (user.position[0] > 0 && !neighbour && !user.frozen) {
    delete global.positions[user.position]
    user.position[0]--
    global.positions[user.position] = user._id
    emitters.userPositionChanged(user._id, user.position)
  }
}

function moveRight() {

  const user = global.users[this.id]
  const neighbour = utils.getNeighbourUserId(user)

  if (user.direction != 'RIGHT') {
    user.direction = 'RIGHT'
    emitters.userDirectionChanged(user._id, user.direction)
  }

  if (user.position[0] < global.mapSize - 1 && !neighbour && !user.frozen) {
    delete global.positions[user.position]
    user.position[0]++
    global.positions[user.position] = user._id
    emitters.userPositionChanged(user._id, user.position)
  }
}

function moveUp() {

  const user = global.users[this.id]
  const neighbour = utils.getNeighbourUserId(user)

  if (user.direction != 'UP') {
    user.direction = 'UP'
    emitters.userDirectionChanged(user._id, user.direction)
  }

  if (user.position[1] > 0 && !neighbour && !user.frozen) {
    delete global.positions[user.position]
    user.position[1]--
    global.positions[user.position] = user._id
    emitters.userPositionChanged(user._id, user.position)
  }
}

function moveDown() {

  const user = global.users[this.id]
  const neighbour = utils.getNeighbourUserId(user)

  if (user.direction != 'DOWN') {
    user.direction = 'DOWN'
    emitters.userDirectionChanged(user._id, user.direction)
  }

  if (user.position[1] < global.mapSize - 1 && !neighbour && !user.frozen) {
    delete global.positions[user.position]
    user.position[1]++
    global.positions[user.position] = user._id
  }

  emitters.userPositionChanged(user._id, user.position)
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
    emitters.userStaminaChanged(user._id, user.stamina)

    hurt(victim, inflictedDamage)
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

function hurt(target, damage) {

  if (damage <= 0) {
    return
  }

  if (target.HP - damage > 0) {
    target.HP -= damage
  } else {
    target.HP = 0
  }

  emitters.userHPChanged(target._id, target.HP)

  if (target.HP === 0) {
    kill(target)
  }
}

function heal(target, surplus) {

  if (surplus <= 0) {
    return
  }

  if (target.HP + surplus <= target.max_HP) {
    target.HP += surplus
  } else {
    target.HP = target.max_HP
  }

  emitters.userHPChanged(target._id, target.HP)
}

function kill(user) {
  user.HP = 0
  user.stamina = 0
  user.equipement = []
  unfreeze(user)
  emitters.userDied(user._id)
}

function freeze(user) {
  user.frozen = true
  user.frozenTimeout = setTimeout(() => user.frozen = false, global.intervals.frozen)
}

function unfreeze(user) {
  user.frozen = false
  clearTimeout(user.frozenTimeout)
  delete user.frozenTimeout
}

function speak(message) {

  if (message.length > global.messageMaxLength) {
    message = message.slice(0, global.messageMaxLength) + '...'
  }

  emitters.userSpoke(this.id, message)
}

function updateUserStamina(user) {

  for (item of user.equipement) {
  
    if (global.items[item].body_part === 'TORSO' && user.stamina < user.max_stamina) {

      var stamina_reg = 15

      var staplus = user.stamina + stamina_reg

      if (staplus >= user.max_stamina) {
        user.stamina = user.max_stamina
      } else {
        user.stamina = staplus
      }

      break
    }

  }

  console.log(user._id,user.max_stamina, user.stamina)

  emitters.userStaminaChanged(user._id, staplus)

}