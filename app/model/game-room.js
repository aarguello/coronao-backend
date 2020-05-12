const Map = require('./map')
const store = require('../store')
const utils = require('../utils')
const handlers = require('../handlers/player')

class GameRoom {

  status = 'QUEUE'
  players = {}
  sockets = {}

  static init() {
    global.gameRooms = []
    return store.accounts.updateMany({}, { $unset: { gameRoomId: ''}})
  }

  static getOrCreate(capacity) {

    let room = global.gameRooms[global.gameRooms.length - 1]

    if (!room || room.status === 'INGAME') {
      const _id = global.gameRooms.length
      room = new GameRoom(_id, capacity, 'map-1')
      global.gameRooms[_id] = room
    }

    return room
  }

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

    for (const [accountId, socket] of Object.entries(this.sockets)) {
      const player = this.players[accountId]
      handlers.initListener(socket, player)
      handlers.initBroadcast(socket, player)
    }
  }

  addPlayer(_id, player) {

    if (this.status === 'INGAME') {
      return
    }

    const position = this.map.randomPosition()
    player.position = position
    player.inventory = utils.getInventory(player.class.name)

    this.map.moveActor(player, null, position)
    this.players[_id] = player
  }

  addSocket(_id, socket) {
    // TODO: check what happens with multiple joins
    socket.join(this._id)
    this.sockets[_id] = socket
  }

  removePlayer(_id) {
    delete this.players[_id]
  }
}

module.exports = GameRoom