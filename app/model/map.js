const broadcast = require('../emitters')

class Map {

  #coordinates

  constructor(name) {
    this.name = name
    this.#coordinates = this.load(`../assets/${name}.json`)
    this.#dropRandomItems(0.05)
  }

  getActor(position) {
    if (position in this.#coordinates) {
      return this.#coordinates[position].actor
    }
  }

  moveActor(actor, from, to) {

    this.removeActor(from)

    if (!this.#coordinates[to]) {
      this.#coordinates[to] = {}
    }

    this.#coordinates[to].actor = actor
  }

  removeActor(position) {
    if (position in this.#coordinates) {
      delete this.#coordinates[position].actor
    }
  }

  getItem(position) {
    return this.#coordinates[position] && this.#coordinates[position].item
  }

  addItem(position, _id, quantity) {

    if (!this.#coordinates[position]) {
      this.#coordinates[position] = {}
    }

    if (!this.#coordinates[position].item) {
      this.#coordinates[position].item = { _id, quantity: 0 }
    }

    if (this.#coordinates[position].item._id === _id) {

      quantity = Math.min(
        this.#coordinates[position].item.quantity + quantity,
        global.config.itemStackLimit,
      )

      this.#coordinates[position].item.quantity = quantity
      broadcast.tileItemChanged(position, _id, quantity)

      return quantity // TODO: test this
    }

    return 0 // TODO: test this
  }

  // TODO: test this
  addItems(position, items = []) {

    if (items.length === 0) {
      return
    }

    const iterator = this.#makeSquareIterator(position)

    for (position of iterator) {

      // TODO: this is repeated a lot, should be a method
      const coord = this.#coordinates[position]
      if (coord && coord.tile && coord.tile.collides) {
        continue
      }

      const item = items.shift()
      const added = this.addItem(position, item._id, item.quantity)

      if (added < item.quantity) {
        item.quantity -= added
        items.unshift(item)
      }

      if (items.length === 0) {
        break
      }
    }
  }

  removeItem(position, quantity) {

    const item = this.#coordinates[position] && this.#coordinates[position].item

    if (!item) {
      return
    }

    quantity = Math.max(this.#coordinates[position].item.quantity - quantity, 0)

    if (quantity > 0) {
      item.quantity = quantity
    } else {
      delete this.#coordinates[position].item
    }

    broadcast.tileItemChanged(position, item._id, quantity)
  }

  collides(position) {

    const data = this.#coordinates[position]

    const horizontalBounds = 0 <= position[0] && position[0] < this.size
    const verticalBounds   = 0 <= position[1] && position[1] < this.size

    const outOfMap       = !horizontalBounds || !verticalBounds
    const actorCollision = data && data.actor
    const tileCollision  = data && data.tile && data.tile.collides

    return !!(outOfMap || actorCollision || tileCollision)
  }

  // TODO: test this
  items() {

    const items = {}

    for (const [position, content] of Object.entries(this.#coordinates)) {
      if (content.item) {
        items[position] = content.item
      }
    }

    return items
  }

  #dropRandomItems(dropChance) {

    const dropables = [
      { itemId: "H07mwFXaKeuULQvOOkEv", quantity: [1, 1] },  // "Brown hat"
      { itemId: "Wq0HhjkjN5zR8N8DENZF", quantity: [1, 1] },  // "Iron helm"
      { itemId: "jXnfxBE01Hx3YsTTi734", quantity: [1, 1] },  // "Plate armor"
      { itemId: "XD0VuskON97LFPG0kdct", quantity: [1, 1] },  // "Tunic"
      { itemId: "8Z5Fzc9t3VAQotaaZEag", quantity: [1, 1] },  // "Long sword"
      { itemId: "J0ldZPPAL2FZg1eqUS4T", quantity: [1, 1] },  // "Oak wand"
      { itemId: "5ihnF4fXoHTQycWfNfAH", quantity: [1, 1] },  // "Wooden arch"
      { itemId: "RVAl3xVPy4nn5v7M84vr", quantity: [1, 1] },  // "Bronze dagger"
      { itemId: "G21gfv4T2YijDaTR0UVh", quantity: [1, 1] },  // "Oak shield"
      { itemId: "2DuoNlOe5SlgANpeFvzo", quantity: [1, 1] },  // "Gold ring"
      { itemId: "4I7A6d1kGyCgTsq9Psiz", quantity: [100, 200] },  // "Pine arrow"
      { itemId: "vBFVyGsUj9beNGjmJpVi", quantity: [200, 400] },  // "Red potion"
      { itemId: "p024Y6sJFnb9IfDVFgkS", quantity: [300, 500] },  // "Blue potion"
    ]

    let dropableIndex = 0

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {

        const position = [i, j]
        const dropItemOnTile = Math.random() < dropChance

        if (!this.collides(position) && dropItemOnTile) {

          const dropable = dropables[dropableIndex]
          const quantity = Map.getRandomInt(
            dropable.quantity[0],
            dropable.quantity[1] + 1,
          )

          if (dropable.itemId in global.items) {
            this.addItem(position, dropable.itemId, quantity)
          }

          dropableIndex = (dropableIndex + 1) % dropables.length
        }
      }
    }
  }

  collisions() {
    return Object
      .entries(this.#coordinates)
      .filter(([position, content]) =>  content.actor || content.tile && content.tile.collides)
      .map(([position, content]) => position.split(',').map(Number))
  }

  randomPosition() {

    const position = [
      Map.getRandomInt(0, this.size),
      Map.getRandomInt(0, this.size),
    ]

    if (this.collides(position)) {
      return this.randomPosition()
    }

    return position
  }

  load(path) {

    const map = require(path)
    const coordinates = {}

    this.size = map.width

    const collisionLayers = map.layers.filter(l => l.name.startsWith('collision'))
    const collisionTiles  = map.tilesets[0].tiles.map(t => (
      t.properties && t.properties.some(p => p.name === 'collides' && p.value)
    ))

    for (let i = 0; i < this.size * this.size; i++) {
      for (let j = 0; j < collisionLayers.length; j++) {
        const tileId = collisionLayers[j].data[i] - 1
        if (tileId >= 0 && collisionTiles[tileId]) {
          const position = [i % this.size, Math.floor(i / this.size)]
          coordinates[position] = { tile: { _id: tileId, collides: true } }
        }
      }
    }

    return coordinates
  }

  // TODO: rewrite this
  getNearestUser(position, fov) {

    const closest = { position: [] }

    Object.entries(this.#coordinates).forEach(([pos, tile]) => {
      const actor = tile.actor
      if (actor && actor.type === 'USER' && actor.hp > 0 && !actor.invisible) {
        pos = pos.split(',').map(Number)
        const distanceBetween = Map.distance(position, pos)
        if (distanceBetween <= fov && (distanceBetween < Map.distance(position, closest.position) || !closest.id)) {
          closest.id = actor
          closest.position = pos
        }
      }
    })

    return closest.id
  }

  // TODO: this should be called from collision
  #inBounds(position) {
    const horizontalBounds = 0 <= position[0] && position[0] < this.size
    const verticalBounds = 0 <= position[1] && position[1] < this.size
    return horizontalBounds && verticalBounds
  }

  *#makeSquareIterator(position = [0, 0]) {

    let topLeft = position
    let topRight, bottomRight, bottomLeft
    let i = 0, radius = 0, length = 0, direction = ''

    while (i < this.size * this.size) {

      const next = position

      if (Map.equals(position, topLeft))     { expandSquare() }
      if (Map.equals(position, topRight))    { direction = 'DOWN' }
      if (Map.equals(position, bottomRight)) { direction = 'LEFT' }
      if (Map.equals(position, bottomLeft))  { direction = 'UP' }

      position = Map.neighbour(position, direction)

      if (this.#inBounds(next)) {
        yield next
        i++
      }
    }

    function expandSquare() {
      length      = 2 * ++radius
      topLeft     = [ topLeft[0] - 1     , topLeft[1] - 1 ]
      topRight    = [ topLeft[0] + length, topLeft[1] ]
      bottomLeft  = [ topLeft[0]         , topLeft[1] + length ]
      bottomRight = [ topLeft[0] + length, topLeft[1] + length ]
      direction   = 'RIGHT'
      position    = topLeft
    }
  }

  static neighbour(position, direction) {
    if (direction === 'LEFT')  return [position[0] - 1, position[1]]
    if (direction === 'RIGHT') return [position[0] + 1, position[1]]
    if (direction === 'UP')    return [position[0], position[1] - 1]
    if (direction === 'DOWN')  return [position[0], position[1] + 1]
  }

  // TODO: test this
  static equals(P, Q) {
    return P[0] === Q[0] && P[1] === Q[1]
  }

  // TODO: test this
  static distance(P, Q) {

    const R = [
      P[0] - Q[0],
      P[1] - Q[1],
    ]

    return Map.norm(R)
  }

  // TODO: test this
  static norm(V) {
    return Math.sqrt(V[0] * V[0] + V[1] * V[1])
  }

  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
  }
}

module.exports = Map