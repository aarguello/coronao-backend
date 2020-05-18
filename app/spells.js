const utils    = require('./utils')
const emitters = require('./emitters')

module.exports.cast = function (roomId, accountId, caster, spellId, position) {

  const spellHandler = {
    'DAMAGE':       damage,
    'HEAL':         heal,
    'REVIVE':       revive,
    'FREEZE':       freeze,
    'UNFREEZE':     unfreeze,
    'INVISIBILITY': invisibility,
  }

  const spell  = global.spells[spellId]
  const target = global.map.getActor(position)

  if (!spell || !target || !target.affectedBy(spell)) {
    return
  }

  const hasSpell = caster.spells.includes(spell._id)

  if (!hasSpell || caster.hp === 0 || spell.mana > caster.mana || caster.meditating) {
    return
  }

  const cast = spellHandler[spell.type](target, spell, caster)

  if (cast) {
    caster.decreaseStat('mana', spell.mana)
    if (target.type === 'USER') emitters.userReceivedSpell(roomId, accountId, spell._id)
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
  target.hurt(damage)

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

  let duration = spell.value

  if (target.type === 'NPC') {
    duration *= 2
  }

  target.freeze(duration)

  return true
}

function unfreeze(target) {

  if (target.hp === 0 || !target.frozen) {
    return
  }

  target.unfreeze()

  return true
}

function invisibility(target, spell) {

  if (target.hp === 0) {
    return
  }

  target.makeInvisible(spell.value)

  return true
}