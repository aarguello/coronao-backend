const Map = require('./map')
const store = require('../store')
const utils = require('../utils')
const playerHandlers = require('../handlers/player')
const mapHandlers = require('../handlers/map')

class GameRoom {

  status = 'INGAME'
  players = {}
  sockets = {}

  static init() {

    global.gameRooms = []

    const room = GameRoom.getOrCreate(global.config.roomCapacity)
    mapHandlers.init(room._id, room.map)

    return store.accounts.updateMany({}, { $unset: { gameRoomId: ''}})
  }

  static getOrCreate(capacity) {

    let room = global.gameRooms[global.gameRooms.length - 1]

    if (!room) {
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
  }

  addPlayer(_id, player) {

    const position = this.map.randomPosition()
    player.position = position
    player.inventory = utils.getInventory(player.class.name)

    this.map.moveActor(player, null, position)
    this.players[_id] = player
  }

  addSocket(_id, socket) {

    socket.join(this._id)
    this.sockets[_id] = socket

    const player = this.players[_id]
    playerHandlers.initListener(this, _id, player, socket)
    playerHandlers.initBroadcast(this._id, _id, player, socket)
  }

  removePlayer(_id) {

    const socket = this.sockets[_id]

    if (socket) {
      socket.leave(this._id)
      delete this.sockets[_id]
    }

    delete this.players[_id]
  }
}

module.exports = GameRoom