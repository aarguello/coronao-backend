const Map = require('./map')
const EventEmitter = require('events')

class Actor {

  #events = new EventEmitter()

  constructor(_id) {
    this._id = _id
    this.stats = { hp: { current: 0, max: 0 } }
  }

  get hp() {
    return this.stats.hp.current
  }

  on(action, handler) {
    this.#events.on(action, handler.bind(null, this._id))
  }

  move(direction) {

    this.direction = direction

    const from = this.position
    const to = Map.neighbour(from, direction)

    if (!this.frozen && !global.map.collides(to)) {
      global.map.moveActor(this, from, to)
      this.position = to
    }
  }

  hurt(damage) {

    this.decreaseStat('hp', damage)

    if (this.hp === 0) {
      this.unfreeze()
    }
  }

  freeze(duration) {
    clearTimeout(this.frozenTimeout)
    this.frozen = true
    this.frozenTimeout = setTimeout(() => this.unfreeze(), duration)
  }

  unfreeze() {
    this.frozen = false
  }

  increaseStat(stat, value) {

    if (value < 0) {
      return
    }

    value = this[stat] + value

    if (value > this.stats[stat].max) {
      value = this.stats[stat].max
    }

    this.stats[stat].current = value
  }

  decreaseStat(stat, value) {

    if (value < 0) {
      return
    }

    value = this[stat] - value

    if (value < 0) {
      value = 0
    }

    this.stats[stat].current = value
  }
}

module.exports = Actor