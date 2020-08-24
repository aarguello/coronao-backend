const Map = require('./map')
const EventEmitter = require('events')
const utils = require('../utils')

class Actor {

  events = new EventEmitter()

  constructor(_id) {
    this._id = _id
    this.stats = { hp: { current: 0, max: 0 } }
    this.direction = 'DOWN'
    this.inventory = {}
    this.inventorySize = 5
  }

  get hp() {
    return this.stats.hp.current
  }

  emit(...args) {
    const action = args[0]
    const params = args.slice(1)
    this.events.emit(action, this._id, ...params)
  }

  move(map, direction) {

    if (direction != this.direction) {
      this.direction = direction
      this.emit('DIRECTION_CHANGED', direction)
    }

    const from = this.position
    const to = Map.neighbour(from, direction)

    if (!this.frozen && !map.collides(to)) {
      map.moveActor(this, from, to)
      this.position = to
      return to
    }
  }

  speak(message) {

    if (message.length > global.config.messageMaxLength) {
      message = message.slice(0, global.config.messageMaxLength) + '...'
    }

    this.emit('SPOKE', message)
  }

  attack(target) {

    if (this.hp === 0) {
      return
    }

    let damage = 0

    if (!target.dodge()) {
      const playerDamage = utils.getRandomInt(...this.getPhysicalDamage())
      const targetDefense = utils.getRandomInt(...target.getPhysicalDefense())
      damage = Math.round(playerDamage - targetDefense)
      damage = Math.max(damage, 0)
      target.hurt(damage)
    }

    this.emit('ATTACKED', damage)
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
    this.emit('DIED')
  }

  freeze(duration) {
    clearTimeout(this.frozenTimeout)
    this.frozen = true
    this.frozenTimeout = setTimeout(() => this.unfreeze(), duration)
  }

  unfreeze() {
    this.frozen = false
  }

  grabItem(map) {

    const item = map.getItem(this.position)
    const itemCount = Object.keys(this.inventory).length

    if (this.hp === 0 || !item) {
      return
    }

    if (itemCount < this.inventorySize || item._id in this.inventory) {

      if (!this.inventory[item._id]) {
        this.inventory[item._id] = 0
      }

      const quantity = Math.min(
        item.quantity,
        global.config.itemStackLimit - this.inventory[item._id],
      )

      this.inventory[item._id] += quantity
      this.emit('INVENTORY_CHANGED', item._id, this.inventory[item._id])
      map.removeItem(this.position, quantity)
    }
  }

  dropItem(map, itemId, quantity = 0) {

    const itemOnTile = map.getItem(this.position)

    if (itemOnTile && itemOnTile._id !== itemId) {
      return
    }

    if (0 < quantity && quantity <= this.inventory[itemId]) {

      if (itemOnTile) {
        quantity = Math.min(quantity, global.config.itemStackLimit - itemOnTile.quantity)
      }

      map.addItem(this.position, itemId, quantity)
      this.decreaseInventoryItem(itemId, quantity)
    }
  }

  decreaseInventoryItem(itemId, amount) {

    if (amount <= 0) {
      return
    }

    amount = Math.max(this.inventory[itemId] - amount, 0)

    if (amount > 0) {
      this.inventory[itemId] = amount
    } else {
      delete this.inventory[itemId]
    }

    this.emit('INVENTORY_CHANGED', itemId, amount)
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

    // TODO: test this
    value = Math.round(value)

    if (value === this[stat]) {
      return
    }

    this.stats[stat].current = value
    this.emit('STAT_CHANGED', stat, this.stats[stat])
  }

  getEvasion() {
    return 0
  }
}

module.exports = Actor