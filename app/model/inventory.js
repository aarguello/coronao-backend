const EventEmitter = require('events')

class Inventory {

  #items
  #capacity
  #itemStackLimit
  #events

  constructor({ capacity, itemStackLimit }) {
    this.#events = new EventEmitter()
    this.#items = new Map()
    this.#capacity = capacity
    this.#itemStackLimit = itemStackLimit
  }

  on(event, callback) {
    this.#events.on(event, callback)
  }

  clear() {
    this.#items.clear()
  }

  size() {
    return this.#items.size
  }

  hasItem(itemId) {
    return this.#items.has(itemId)
  }

  count(itemId) {
    return this.#items.get(itemId) || 0
  }

  items() {

    const items = []

    for (const [_id, quantity] of this.#items.entries()) {
      items.push({ _id, quantity })
    }

    return items
  }

  addItem(itemId, quantity) {

    if (this.size() == this.#capacity || quantity < 0) {
      return 0
    }

    const currentQuantity = this.count(itemId)
    const newQuantity = Math.min(this.#itemStackLimit, currentQuantity + quantity)

    if (newQuantity > currentQuantity) {
      this.#items.set(itemId, newQuantity)
      this.#events.emit('INVENTORY_CHANGED', itemId, newQuantity)
    }

    return newQuantity - currentQuantity
  }

  removeItem(itemId, quantity) {

    const currentQuantity = this.count(itemId)

    if (quantity <= 0 || currentQuantity == 0) {
      return 0
    }

    const newQuantity = Math.max(0, currentQuantity - quantity)

    if (newQuantity == 0) {
      this.#items.delete(itemId)
    } else {
      this.#items.set(itemId, newQuantity)
    }

    this.#events.emit('INVENTORY_CHANGED', itemId, newQuantity)

    return currentQuantity - newQuantity
  }
}

module.exports = Inventory