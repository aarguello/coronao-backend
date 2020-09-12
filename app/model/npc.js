const Actor = require('./actor')
const utils = require('../utils')

class NPC extends Actor {

  constructor(_id, name) {
    super(_id)
    this.name = name
    this.type = 'NPC'
    this.stats = { hp: { current: 9999, max: 9999 } }
  }

  think(map) {
    this.wander(map)
  }

  wander(map) {

    const direction = utils.getRandomFromList(['LEFT', 'RIGHT', 'UP', 'DOWN'])
    const position = this.move(map, direction)

    if (position) {
      this.emit('POSITION_CHANGED', position)
    }
  }

  getEvasion() {
    return 0
  }

  getPhysicalDefense() {
    return [ 0, 0 ]
  }

  getMagicalDefense() {
    return [ 0, 0 ]
  }

  affectedBy(spell) {
    return ['DAMAGE', 'FREEZE', 'UNFREEZE'].includes(spell.type)
  }

}

module.exports = NPC