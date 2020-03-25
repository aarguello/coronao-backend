const utils    = require('./utils')
const emitters = require('./emitters')
const items    = require('./items')
const spells   = require('./spells')

module.exports.create   = create
module.exports.hurt     = hurt
module.exports.heal     = heal
module.exports.freeze   = freeze
module.exports.unfreeze = unfreeze
module.exports.destroy  = destroy
module.exports.move     = move
module.exports.attack   = attack
module.exports.speak    = speak

function create(_id, name) {

  const userClass = utils.getRandomClass()
  const userRace  = utils.getRandomRace()
  const position  = utils.getRandomPosition()

  const user = {
    _id: _id,
    name: name,
    class: userClass.name,
    race: userRace.name,
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

  global.users[_id] = user

  moveActor('USER', user._id, position)
  setInterval(() => updateUserStamina(user), global.intervals.staminaRecover)

  return user
}

function destroy(userId) {
  const user = global.users[userId]
  delete global.map.positions[user.position].USER
  delete global.users[userId]
  emitters.userLeft(userId)
}

function move(direction) {

  if (!['LEFT', 'RIGHT', 'UP', 'DOWN'].includes(direction)) {
    return
  }

  const user = global.users[this.id]
  const position = utils.getNeighbourPosition(user.position, direction)

  pivotActor('USER', user._id, direction, emitters.userDirectionChanged)
  moveActor('USER', user._id, position, emitters.userPositionChanged)
}

function getActor(_id, type) {

  let actor

  if (type === 'USER') {
    actor = global.users[_id]
  }

  if (type === 'NPC') {
    actor = global.aliveNPCs[_id]
  }

  return actor
}

function moveActor(type, _id, position, emitter) {

  const actor = getActor(_id, type)

  if (!actor || !utils.positionInMap(position) || utils.checkCollision(position)) {
    return
  }

  if (global.map.positions[actor.position]) {
    delete global.map.positions[actor.position][type]
  }

  actor.position = position

  if (position in global.map.positions) {
    global.map.positions[position][type] = actor._id
  } else {
    global.map.positions[position] = { [type]: actor._id }
  }

  if (emitter) {
    emitter(_id, position)
  }
}

function pivotActor(type, _id, direction, emitter) {

  const actor = getActor(_id, type)

  if (!actor || actor.direction === direction) {
    return
  }

  actor.direction = direction
  emitter(actor._id, actor.direction)
}

function attack() {

  const user     = global.users[this.id]
  const position = utils.getNeighbourPosition(user.position, user.direction)
  const victimId = (global.map.positions[position] || {}).USER

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

  // console.log(user._id,user.max_stamina, user.stamina)

  emitters.userStaminaChanged(user._id, staplus)

}
