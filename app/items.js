const utils    = require('./utils')
const emitters = require('./emitters')

module.exports.equipItem          = equipItem
module.exports.getEquipementBonus = getEquipementBonus

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

function getEquipementBonus(user, attribute) {

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