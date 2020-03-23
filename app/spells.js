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

  const user   = global.users[this.id]
  const target = global.users[targetId]
  const spell  = global.spells[spellId]

  const hasSpell = user.spells.includes(spellId)

  if (!target || !spell || !hasSpell || user.HP === 0 || spell.mana > user.mana) {
    return
  }

  const cast = spellHandler[spell.type](user, target, spell)

  if (cast) {
    emitters.userReceivedSpell(target._id, spell._id)
    consumeMana(user, spell.mana)
  }
}

function damage(user, target, spell) {

  if (user._id === target._id || target.HP === 0) {
    return false
  }

  const spellDamage  = utils.getRandomInt(spell.value[0], spell.value[1])
  const itemsDamage  = items.getEquipementBonus(user, 'magical_damage') / 100 + 1
  const itemsDefense = items.getEquipementBonus(user, 'magical_defense')
  const classDamage  = global.classes[user.class].magical_damage

  const damage = Math.round(spellDamage * itemsDamage * classDamage - itemsDefense)
  users.inflictDamage(target, damage)

  return true
}

function heal(spell, target) {
  console.log('Heal user', target._id)
}

function revive(spell, target) {
  console.log('Revive user', target._id)
}

function freeze(spell, target) {
  console.log('Freeze user', target._id)
}

function unfreeze(spell, target) {
  console.log('Unfreeze user', target._id)
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

  emitters.userManaChange(user._id, user.mana)
}