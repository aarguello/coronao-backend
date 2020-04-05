
class Map {

  constructor(name) {
    this.name = name
    this.coordinates = this.load(`../assets/${name}.json`)
  }

  moveActor(actor, from, to) {

    if (this.coordinates[from]) {
      delete this.coordinates[from].actor
    }

    if (!this.coordinates[to]) {
      this.coordinates[to] = {}
    }

    this.coordinates[to].actor = {
      _id: actor._id,
      type: actor.type
    }
  }

  collides(position) {

    const data = this.coordinates[position]

    const horizontalBounds = 0 <= position[0] && position[0] < this.size
    const verticalBounds   = 0 <= position[1] && position[1] < this.size

    const outOfMap       = !horizontalBounds || !verticalBounds
    const actorCollision = data && data.actor
    const tileCollision  = data && data.tile && data.tile.collides

    return !!(outOfMap || actorCollision || tileCollision)
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

  static neighbour(position, direction) {
    if (direction === 'LEFT')  return [position[0] - 1, position[1]]
    if (direction === 'RIGHT') return [position[0] + 1, position[1]]
    if (direction === 'UP')    return [position[0], position[1] - 1]
    if (direction === 'DOWN')  return [position[0], position[1] + 1]
  }
}

module.exports = Map