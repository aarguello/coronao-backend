const Map      = require('./map')
const utils    = require('./utils')
const emitters = require('./emitters')

module.exports.handleBlow = function () {

  const user = global.users[this.id]

  if (user.hp === 0 || user.meditating || user.stamina < global.blowEffort) {
    return
  }

  const neighbour = Map.getNeighbourPosition(user.position, user.direction)
  const target    = Map.getActorInTile(neighbour)

  if (!target || target.hp === 0) {
    emitters.userAttacked(user._id, 0)
    return
  }

  const missChance = target.getEvasion()
  const blowLands  = utils.getRandomBool(missChance)

  if (blowLands) {
    const damage = user.getPhysicalDamage() - target.getPhysicalDefense()
    target.suffer(damage)
    emitters.userAttacked(user._id, damage)
  } else {
    emitters.userMissedAttack(user._id)
  }

  user.decreaseStat('stamina', global.blowEffort)
}

module.exports.handleSpell = function (spellId, position) {

  const spellHandler = {
    'DAMAGE':       damage,
    'HEAL':         heal,
    'REVIVE':       revive,
    'FREEZE':       freeze,
    'UNFREEZE':     unfreeze,
    'INVISIBILITY': invisibility,
  }

  const spell  = global.spells[spellId]
  const target = Map.getActorInTile(position)

  if (!spell || !target || !target.affectedBy(spell)) {
    return
  }

  const caster   = global.users[this.id]
  const hasSpell = caster.spells.includes(spell._id)

  if (!hasSpell || caster.hp === 0 || spell.mana > caster.mana || caster.meditating) {
    return
  }

  const cast = spellHandler[spell.type](target, spell, caster)

  if (cast) {
    caster.decreaseStat('mana', spell.mana)
    if (target.type === 'USER') emitters.userReceivedSpell(target._id, spell._id)
    if (target.type === 'NPC')  emitters.npcReceivedSpell(target._id, spell._id)
  }
}

function damage(target, spell, caster) {

  if (caster._id === target._id || target.hp === 0) {
    return false
  }

  const spellDamage   = utils.getRandomInt(spell.value[0], spell.value[1])
  const casterDamage  = caster.getMagicalDamage()
  const targetDefense = target.getMagicalDefense()

  const damage = spellDamage * casterDamage - targetDefense
  target.suffer(damage)

  return true
}

function heal(target, spell) {

  if (target.hp === 0) {
    return
  }

  target.increaseStat('hp', utils.getRandomInt(spell.value[0], spell.value[1]))

  return true
}

function revive(target) {

  if (target.hp > 0) {
    return
  }

  target.revive()

  return true
}

function freeze(target, spell, caster) {

  if (caster._id === target._id || target.hp === 0 || target.frozen) {
    return
  }

  target.freeze()

  return true
}

function unfreeze(target) {

  if (target.hp === 0 || !target.frozen) {
    return
  }

  target.unfreeze()

  return true
}

function invisibility(target) {

  if (target.HP === 0) {
    return
  }

  target.makeInvisible(global.intervals.invisibility)

  return true
}