const Map      = require('./map')
const utils    = require('./utils')
const emitters = require('./emitters')

module.exports.handleBlow = function () {

  const user      = global.users[this.id]
  const neighbour = Map.getNeighbourPosition(user.position, user.direction)
  const tile      = global.map.positions[neighbour]
  const target    = global.users[tile && tile.USER]

  if (!target || target.HP === 0 || user.HP === 0 || user.stamina < global.staminaRequired) {
    return
  }

  const damage = global.baseDamage + user.getPhysicalDamage() - target.getPhysicalDefense()

  target.suffer(damage)
  emitters.userAttacked(user._id, damage)

  user.decreaseStat('stamina', global.staminaRequired)
}

module.exports.handleSpell = function (targetId, spellId) {

  const spellHandler = {
    'DAMAGE':   damage,
    'HEAL':     heal,
    'REVIVE':   revive,
    'FREEZE':   freeze,
    'UNFREEZE': unfreeze,
  }

  const target = global.users[targetId]
  const spell  = global.spells[spellId]
  const caster = global.users[this.id]

  const hasSpell = caster.spells.includes(spellId)

  if (!target || !spell || !hasSpell || caster.HP === 0 || spell.mana > caster.mana) {
    return
  }

  const cast = spellHandler[spell.type](target, spell, caster)

  if (cast) {
    emitters.userReceivedSpell(target._id, spell._id)
    caster.decreaseStat('MANA', spell.mana)
  }
}

function damage(target, spell, caster) {

  if (caster._id === target._id || target.HP === 0) {
    return false
  }

  const spellDamage   = utils.getRandomInt(spell.value[0], spell.value[1])
  const casterDamage  = caster.getMagicalDamage()
  const targetDefense = target.getMagicalDefense()

  const damage = Math.round(spellDamage * casterDamage - targetDefense)
  target.suffer(damage)

  return true
}

function heal(target, spell) {

  if (target.HP === 0) {
    return
  }

  target.increaseStat('HP', utils.getRandomInt(spell.value[0], spell.value[1]))

  return true
}

function revive(target) {

  if (target.HP > 0) {
    return
  }

  target.revive()

  return true
}

function freeze(target, spell, caster) {

  if (caster._id === target._id || target.HP === 0 || target.frozen) {
    return
  }

  target.freeze()

  return true
}

function unfreeze(target) {

  if (target.HP === 0 || !target.frozen) {
    return
  }

  target.unfreeze()

  return true
}