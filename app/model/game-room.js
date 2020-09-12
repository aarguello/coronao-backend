const Map = require('./map')
const NPC = require('./npc')
const store = require('../store')
const utils = require('../utils')
const playerHandlers = require('../handlers/player')
const mapHandlers = require('../handlers/map')
const npcHandlers = require('../handlers/npc')

class GameRoom {

  status = 'INGAME'
  players = {}
  NPCs = {}
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
      room = new GameRoom(_id, capacity, 'map-2')
      global.gameRooms[_id] = room
    }

    return room
  }

  constructor(_id, capacity, map) {
    this._id = _id
    this.capacity = capacity
    this.map = new Map(map)
    this.spawnNPCs()
  }

  spawnNPCs() {

    // This is, of course, temporary
    this.addNPC(utils.getRandomId(), 'Zombie')
    this.addNPC(utils.getRandomId(), 'Zombie')
    this.addNPC(utils.getRandomId(), 'Zombie')
    this.addNPC(utils.getRandomId(), 'Zombie')
    this.addNPC(utils.getRandomId(), 'Zombie')

    setInterval(() => this.handleNPCs(), 1500)
  }

  addNPC(_id, name) {

    const npc = new NPC(_id, name)
    const position = this.map.randomPosition()

    npc.position = position

    this.map.moveActor(npc, null, position)
    this.NPCs[_id] = npc

    npcHandlers.init(this._id , npc)
  }

  handleNPCs() {
    for (const NPC of Object.values(this.NPCs)) {
      NPC.think(this.map)
    }
  }

  addPlayer(_id, player) {

    if (Object.keys(this.players).length == this.capacity) {
      return
    }

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
    playerHandlers.initListener(this, player, socket)
    playerHandlers.initBroadcast(this, player, socket)
  }

  removePlayer(_id) {

    const socket = this.sockets[_id]

    if (socket) {
      socket.leave(this._id)
      delete this.sockets[_id]
    }

    this.map.removeActor(this.players[_id].position)

    delete this.players[_id]
  }
}

module.exports = GameRoom