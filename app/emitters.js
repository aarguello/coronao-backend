
module.exports.init = (io) => this.io = io

module.exports.userJoinedGameRoom = (userId, gameRoom) => {

  const user = {
    _id: userId
  }

  const room = {
    _id: gameRoom._id,
    capacity: gameRoom.capacity,
    players: Object.entries(gameRoom.players).map(([_id, player]) => ({
      _id,
      name: player.name
    }))
  }

  this.io.to(room._id).emit('USER_JOINED_GAME_ROOM', { user,  room })
}

module.exports.userLeftGameRoom = (userId, roomId, socketId) => {
  this.io.to(roomId).emit('USER_LEFT_GAME_ROOM', userId)
  this.io.to(socketId).emit('USER_LEFT_GAME_ROOM', userId)
}

module.exports.userJoined = (socket, roomId, accountId, player) => {
  const user = parsePlayer(accountId, player)
  socket.broadcast.to(roomId).emit('USER_JOINED', user)
}

module.exports.userLeft = (socket, roomId, accountId) => {
  socket.broadcast.to(roomId).emit('USER_LEFT', { _id: accountId })
}

module.exports.userWelcome = (socketId, accountId, players, aliveNPCs, items) => {

  const users = {}
  const globals = { users, items, aliveNPCs }

  for (const [_id, player] of Object.entries(players)) {
    users[_id] = parsePlayer(_id, player)
  }

  this.io.to(socketId).emit('USER_WELCOME', { user: users[accountId], globals })
}

module.exports.gameState = (roomId, players, NPCs, items) => {

  const users = {}

  for (const [_id, player] of Object.entries(players)) {
    users[_id] = parsePlayer(_id, player)
  }

  this.io.to(roomId).emit('GAME_STATE', { users, NPCs, items })
}

module.exports.userPositionChanged = (roomId, accountId, socket, position, index) => {

  const packet = {
    _id: accountId,
    position,
  }

  this.io.to(socket.id).emit('USER_POSITION_CHANGED', { ...packet, index })
  socket.broadcast.to(roomId).emit('USER_POSITION_CHANGED', packet)
}

module.exports.userDirectionChanged = (roomId, accountId, direction) => {

  const packet = {
    _id: accountId,
    direction,
  }

  this.io.to(roomId).emit('USER_DIRECTION_CHANGED', packet)
}

module.exports.userInventoryChanged = (roomId, accountId, itemId, amount) => {

  const packet = {
    _id: accountId,
    inventory: { [itemId]: amount },
  }

  this.io.to(roomId).emit('USER_INVENTORY_CHANGED', packet)
}

module.exports.userAttacked = (roomId, accountId, damage) => {

  const packet = {
    user: { _id: accountId },
    damage,
  }

  this.io.to(roomId).emit('USER_ATTACKED', packet)
}

module.exports.userReceivedSpell = (roomId, accountId, spellId) => {

  const packet = {
    user: { _id: accountId },
    spellId,
  }

  this.io.to(roomId).emit('USER_RECEIVED_SPELL', packet)
}

module.exports.userStatChanged = (roomId, accountId, stat, value) => {

  const packet = {
    _id: accountId,
    stats: { [stat]: value }
  }

  this.io.to(roomId).emit('USER_STAT_CHANGED', packet)
}

module.exports.userVisibilityChanged = (roomId, accountId, invisible) => {

  const packet = {
    _id: accountId,
    invisible,
  }

  this.io.to(roomId).emit('USER_VISIBILITY_CHANGED', packet)
}

module.exports.userEquipedItem = (roomId, accountId, itemId) => {

  const packet = {
    user: { _id: accountId },
    itemId,
  }

  this.io.to(roomId).emit('USER_EQUIPED_ITEM', packet)
}

module.exports.userUnequipedItem = (roomId, accountId, itemId) => {

  const packet = {
    user: { _id: accountId },
    itemId,
  }

  this.io.to(roomId).emit('USER_UNEQUIPED_ITEM', packet)
}

module.exports.userDied = (roomId, accountId) => {
  this.io.to(roomId).emit('USER_DIED', { _id: accountId })
}

module.exports.userRevived = (roomId, accountId) => {
  this.io.to(roomId).emit('USER_REVIVED', { _id: accountId })
}

module.exports.userSpoke = (roomId, accountId, message) => {

  const packet = {
    user: { _id: accountId },
    message,
  }

  this.io.to(roomId).emit('USER_SPOKE', packet)
}

module.exports.userStartedMeditating = (roomId, accountId) => {
  this.io.to(roomId).emit('USER_STARTED_MEDITATING', { _id: accountId })
}

module.exports.userStoppedMeditating = (roomId, accountId) => {
  this.io.to(roomId).emit('USER_STOPPED_MEDITATING', { _id: accountId })
}

module.exports.npcSpawned = (npc) => {
  this.io.emit('NPC_SPAWNED', npc)
}

module.exports.npcSpeak = (_id, message) => {
  this.io.emit('NPC_SPOKE', { npc: { _id }, message })
}

module.exports.npcDied = (_id) => {
  this.io.emit('NPC_DIED', { _id })
}

module.exports.npcPositionChanged = (_id, position) => {
  this.io.emit('NPC_POSITION_CHANGED', { _id, position })
}

module.exports.npcDirectionChanged = (_id, direction) => {
  this.io.emit('NPC_DIRECTION_CHANGED', { _id, direction })
}

module.exports.npcAttacked = (_id, damage) => {
  this.io.emit('NPC_ATTACKED', { npc: { _id }, damage })
}

module.exports.npcStatChanged = (_id, stat, value) => {
  this.io.emit(`NPC_STAT_CHANGED`, { _id, stats: { [stat]: value } })
}

module.exports.npcReceivedSpell = (_id, spellId) => {
  this.io.emit('NPC_RECEIVED_SPELL', { npc: { _id }, spellId })
}

module.exports.tileItemChanged = (roomId, position, itemId, quantity) => {
  this.io.to(roomId).emit('TILE_ITEM_CHANGED', { position, itemId, quantity })
}

function parsePlayer(_id, p) {

  const player = {
    _id,
    name: p.name,
    race: p.race.name,
    class: p.class.name,
    stats: p.stats,
    spells: p.spells,
    position: p.position,
    intervals: p.intervals,
    inventory: p.inventory,
    equipment: p.equipment.map(i => i._id),
  }

  return player
}