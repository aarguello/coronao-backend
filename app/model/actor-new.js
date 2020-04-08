const Map = require('./map')
const EventEmitter = require('events')

class Actor {

  #events = new EventEmitter()

  constructor(_id) {
    this._id = _id
    this.stats = { hp: { current: 0, max: 0 } }
    this.inventory = {}
    this.inventorySize = 5
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

  attack(target) {

    if (this.hp === 0 || target.dodge()) {
      return
    }

    const damage = this.getPhysicalDamage() - target.getPhysicalDefense()
    target.hurt(damage)
  }

  dodge() {
    return Math.random() <= this.getEvasion()
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

  grabItem() {

    const item = global.map.getItem(this.position)
    const itemCount = Object.keys(this.inventory).length

    if (!item) {
      return
    }

    if (itemCount < this.inventorySize || item._id in this.inventory) {

      if (!this.inventory[item._id]) {
        this.inventory[item._id] = 0
      }

      let quantity = item.quantity

      if (this.inventory[item._id] + quantity > global.itemStackLimit) {
        quantity = global.itemStackLimit - this.inventory[item._id]
      }

      this.inventory[item._id] += quantity
      global.map.removeItem(this.position, quantity)
    }
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

  getEvasion() {
    return 0
  }
}

module.exports = Actor