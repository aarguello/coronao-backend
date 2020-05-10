const Map = require('./map')

class GameRoom {

  status = 'QUEUE'
  players = {}

  constructor(_id, capacity, map) {
    this._id = _id
    this.capacity = capacity
    this.map = new Map(map)
  }

  startGame() {

    if (Object.keys(this.players).length < this.capacity) {
      return
    }

    this.status = 'INGAME'
  }

  addPlayer(_id, player) {

    if (this.status === 'INGAME') {
      return
    }

    const position = this.map.randomPosition()
    player.position = position

    this.map.moveActor(player, null, position)
    this.players[_id] = player
  }

  removePlayer(_id) {
    delete this.players[_id]
  }
}

module.exports = GameRoom