
const spellHandler = {
  'DAMAGE': applyDamage,
  'HEAL': heal,
  'FREEZE': freeze,
  'UNFREEZE': unfreeze,
  'REVIVE': revive,
}

module.exports.handleSpell = (spellId, targetId) => {

  const spell  = global.spells[spellId]
  const target = global.users[targetId]

  if (spell && target) {
    spellHandler[spell.type](spell, target)
  }
}

function applyDamage(spell, target) {
  console.log('Applying spell damage to', target._id)
}

function heal(spell, target) {
  console.log('Heal user', target._id)
}

function freeze(spell, target) {
  console.log('Freeze user', target._id)
}

function unfreeze(spell, target) {
  console.log('Unfreeze user', target._id)
}

function revive(spell, target) {
  console.log('Revive user', target._id)
}