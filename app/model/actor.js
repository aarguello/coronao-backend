
const Map = require('../map')

class Actor {

  constructor(_id) {
    this._id = _id
    this.direction = 'DOWN'
  }

  /* Getters */

  get hp() {
    return this.stats.hp.current
  }

  /* Public  */

  move(direction) {

    this.direction = direction

    if (!this.frozen) {
      const position = Map.getNeighbourPosition(this.position, direction)
      return Map.updateActorPosition(this, position)
    }
  }

  suffer(damage) {

    this.decreaseStat('hp', damage)

    if (this.hp === 0) {
      this.kill()
    }
  }

  kill() {
    this.setStat('hp', 0)
    this.setStat('stamina', 0)
    this.unfreeze()
  }

  freeze() {
    this.frozen = true
    this.frozenTimeout = setTimeout(() => this.frozen = false, global.intervals.frozen)
  }

  unfreeze() {
    this.frozen = false
    clearTimeout(this.frozenTimeout)
    delete this.frozenTimeout
  }

  increaseStat(stat, value) {
    if (this.stats[stat]) {
      return this.setStat(stat, this[stat] + value)
    }
  }

  decreaseStat(stat, value) {
    if (this.stats[stat]) {
      return this.setStat(stat, this[stat] - value)
    }
  }

  // This method should be private, but it needs to be called from child classes
  // and JS does not support 'protected' methods
  // Use increaseStat / decreaseStat as a public alternative
  setStat(stat, value) {

    value = Math.round(value)

    const min = 0
    const max = this.stats[stat].max

    if (value < min) {
      value = min
    } else if (value > max) {
      value = max
    }

    if (this[stat] != value) {
      this.stats[stat].current = value
      return true
    }
  }
}

module.exports = Actor