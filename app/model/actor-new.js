const Map = require('./map')
const EventEmitter = require('events')

class Actor {

  events = new EventEmitter()

  constructor(_id) {
    this._id = _id
    this.stats = { hp: { current: 0, max: 0 } }
    this.inventory = {}
    this.inventorySize = 5
    this.#initEventEmitter()
  }

  get hp() {
    return this.stats.hp.current
  }

  #initEventEmitter() {

    const emitter = this.events.emit

    this.events.emit = (...args) => {
      emitter.call(this.events, this._id, ...args)
    }
  }

  move(direction) {

    if (direction != this.direction) {
      this.direction = direction
      this.events.emit('DIRECTION_CHANGED', direction)
    }

    const from = this.position
    const to = Map.neighbour(from, direction)

    if (!this.frozen && !global.map.collides(to)) {
      global.map.moveActor(this, from, to)
      this.position = to
      this.events.emit('POSITION_CHANGED', to)
    }
  }

  attack(target) {

    if (this.hp === 0) {
      return
    }

    let damage = 0

    if (!target.dodge()) {
      damage = Math.max(this.getPhysicalDamage() - target.getPhysicalDefense(), 0)
      target.hurt(damage)
    }

    this.events.emit('ATTACKED', damage)
  }

  dodge() {
    return Math.random() <= this.getEvasion()
  }

  hurt(damage) {
    if (this.hp - damage > 0) {
      this.decreaseStat('hp', damage)
    } else {
      this.kill()
    }
  }

  kill() {
    this.decreaseStat('hp', this.hp)
    this.unfreeze()
    this.events.emit('DIED')
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

  dropItem(itemId, quantity = 0) {

    const currentItem = global.map.getItem(this.position)

    if (!this.inventory[itemId] || quantity <= 0 || currentItem && currentItem._id !== itemId) {
      return
    }

    quantity = Math.min(quantity, this.inventory[itemId])

    if (currentItem) {
      quantity = Math.min(quantity, global.itemStackLimit - currentItem.quantity)
    }

    global.map.addItem(this.position, itemId, quantity)
    this.removeFromInventory(itemId, quantity)
  }

  removeFromInventory(itemId, amount) {
    if (this.inventory[itemId] - amount > 0) {
      this.inventory[itemId] -= amount
    } else {
      delete this.inventory[itemId]
    }
  }

  increaseStat(stat, value) {

    if (value < 0) {
      return
    }

    value = Math.min(this[stat] + value, this.stats[stat].max)
    this.#setStat(stat, value)
  }

  decreaseStat(stat, value) {

    if (value < 0) {
      return
    }

    value = Math.max(0, this[stat] - value)
    this.#setStat(stat, value)
  }

  #setStat(stat, value) {

    if (value === this[stat]) {
      return
    }

    this.stats[stat].current = value
    this.events.emit('STAT_CHANGED', stat, value)
  }

  getEvasion() {
    return 0
  }
}

module.exports = Actor