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

  }

  addPlayer(_id, name, race, class_) {

  }

  removePlayer(_id) {

  }
}

module.exports = GameRoom