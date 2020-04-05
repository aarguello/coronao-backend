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
}

module.exports = Actor