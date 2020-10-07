
class Inventory {

  #items
  #capacity
  #itemStackLimit

  constructor({ capacity, itemStackLimit }) {
    this.#items = new Map()
    this.#capacity = capacity
    this.#itemStackLimit = itemStackLimit
  }

  size() {
    return this.#items.size
  }

  hasItem(itemId) {
    return this.#items.has(itemId)
  }

  itemQuantity(itemId) {
    return this.#items.get(itemId) || 0
  }

  addItem(itemId, quantity) {

    if (this.#items.size == this.#capacity) {
      return 0
    }

    const currentQuantity = this.#items.get(itemId) || 0
    const newQuantity = Math.min(this.#itemStackLimit, currentQuantity + quantity)

    this.#items.set(itemId, newQuantity)

    return newQuantity - currentQuantity
  }

  removeItem(itemId, quantity) {

    const currentQuantity = this.#items.get(itemId) || 0
    const newQuantity = Math.max(0, currentQuantity - quantity)

    if (newQuantity == 0) {
      this.#items.delete(itemId)
    } else {
      this.#items.set(itemId, newQuantity)
    }

    return currentQuantity - newQuantity
  }
}

module.exports = Inventory