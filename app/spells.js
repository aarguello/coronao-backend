const utils    = require('./utils')
const users    = require('./user')
const items    = require('./items')
const emitters = require('./emitters')

const spellHandler = {
  'DAMAGE':   damage,
  'HEAL':     heal,
  'REVIVE':   revive,
  'FREEZE':   freeze,
  'UNFREEZE': unfreeze,
}

module.exports.handleSpell = function (targetId, spellId) {

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
    consumeMana(caster, spell.mana)
  }
}

function damage(target, spell, caster) {

  if (caster._id === target._id || target.HP === 0) {
    return false
  }

  const spellDamage  = utils.getRandomInt(spell.value[0], spell.value[1])
  const itemsDamage  = items.getEquipementBonus(caster, 'magical_damage') / 100 + 1
  const itemsDefense = items.getEquipementBonus(caster, 'magical_defense')
  const classDamage  = global.classes[caster.class].magical_damage

  const damage = Math.round(spellDamage * itemsDamage * classDamage - itemsDefense)
  users.hurt(target, damage)

  return true
}

function heal(target, spell) {

  if (target.HP === 0) {
    return
  }

  const surplus = utils.getRandomInt(spell.value[0], spell.value[1])
  users.heal(target, surplus)

  return true
}

function revive(target) {

  if (target.HP > 0) {
    return
  }

  target.HP = Math.round(target.max_HP * 0.2)
  target.mana = Math.round(target.max_mana * 0.2)
  target.stamina = Math.round(target.max_stamina * 0.2)

  emitters.userRevived(target._id)
  emitters.userHPChanged(target._id, target.HP)
  emitters.userManaChanged(target._id, target.mana)
  emitters.userStaminaChanged(target._id, target.stamina)

  return true
}

function freeze(target, spell, caster) {

  if (caster._id === target._id || target.HP === 0 || target.frozen) {
    return
  }

  users.freeze(target)

  return true
}

function unfreeze(target) {

  if (target.HP === 0 || !target.frozen) {
    return
  }

  users.unfreeze(target)

  return true
}

function consumeMana(user, mana) {

  if (mana <= 0) {
    return
  }

  if (user.mana - mana > 0) {
    user.mana -= mana
  } else {
    user.mana = 0
  }

  emitters.userManaChanged(user._id, user.mana)
}