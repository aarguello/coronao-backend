
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

module.exports.userJoined = (socket, roomId, player) => {
  const user = parsePlayer(player)
  socket.broadcast.to(roomId).emit('USER_JOINED', user)
}

module.exports.userLeft = (socket, roomId, playerId) => {
  socket.broadcast.to(roomId).emit('USER_LEFT', { _id: playerId })
}

module.exports.userWelcome = (socketId, room, playerId) => {

  const players = {}
  for (const p of Object.values(room.players)) {
    players[p._id] = parsePlayer(p)
  }

  const globals = {
    users: players,
    items: room.map.items(),
    aliveNPCs: {},
  }

  this.io.to(socketId).emit('USER_WELCOME', { user: players[playerId], globals })
}

module.exports.gameState = (roomId, players, NPCs, items) => {

  const users = {}

  for (const [_id, player] of Object.entries(players)) {
    users[_id] = parsePlayer(player)
  }

  this.io.to(roomId).emit('GAME_STATE', { users, NPCs, items })
}

module.exports.userPositionChanged = (roomId, playerId, socket, position, index) => {

  const packet = {
    _id: playerId,
    position,
  }

  this.io.to(socket.id).emit('USER_POSITION_CHANGED', { ...packet, index })
  socket.broadcast.to(roomId).emit('USER_POSITION_CHANGED', packet)
}

module.exports.userDirectionChanged = (roomId, playerId, direction) => {

  const packet = {
    _id: playerId,
    direction,
  }

  this.io.to(roomId).emit('USER_DIRECTION_CHANGED', packet)
}

module.exports.userInventoryChanged = (roomId, playerId, itemId, amount) => {

  const packet = {
    _id: playerId,
    inventory: { [itemId]: amount },
  }

  this.io.to(roomId).emit('USER_INVENTORY_CHANGED', packet)
}

module.exports.userAttacked = (roomId, playerId, damage) => {

  const packet = {
    user: { _id: playerId },
    damage,
  }

  this.io.to(roomId).emit('USER_ATTACKED', packet)
}

module.exports.userReceivedSpell = (roomId, playerId, spellId) => {

  const packet = {
    user: { _id: playerId },
    spellId,
  }

  this.io.to(roomId).emit('USER_RECEIVED_SPELL', packet)
}

module.exports.userStatChanged = (roomId, playerId, stat, value) => {

  const packet = {
    _id: playerId,
    stats: { [stat]: value }
  }

  this.io.to(roomId).emit('USER_STAT_CHANGED', packet)
}

module.exports.userCombatStatsChanged = (socketId, player) => {

  const average = ([a, b]) => (a + b) / 2

  const combatStats = {
    physicalDamage: Math.round(average(player.getPhysicalDamage())),
    physicalDefense: Math.round(average(player.getPhysicalDefense())),
    magicalDamage: Math.round(average(player.getMagicalDamage()) * 100 - 100),
    magicalDefense: Math.round(average(player.getMagicalDefense())),
    evasion: Math.round(player.getEvasion() * 100),
  }

  const packet = {
    _id: player._id,
    combatStats,
  }

  this.io.to(socketId).emit('USER_COMBAT_STATS_CHANGED', packet)
}

module.exports.userVisibilityChanged = (roomId, playerId, invisible) => {

  const packet = {
    _id: playerId,
    invisible,
  }

  this.io.to(roomId).emit('USER_VISIBILITY_CHANGED', packet)
}

module.exports.userEquipedItem = (roomId, playerId, itemId) => {

  const packet = {
    user: { _id: playerId },
    itemId,
  }

  this.io.to(roomId).emit('USER_EQUIPED_ITEM', packet)
}

module.exports.userUnequipedItem = (roomId, playerId, itemId) => {

  const packet = {
    user: { _id: playerId },
    itemId,
  }

  this.io.to(roomId).emit('USER_UNEQUIPED_ITEM', packet)
}

module.exports.userDied = (roomId, playerId) => {
  this.io.to(roomId).emit('USER_DIED', { _id: playerId })
}

module.exports.userRevived = (roomId, playerId) => {
  this.io.to(roomId).emit('USER_REVIVED', { _id: playerId })
}

module.exports.userSpoke = (roomId, playerId, message) => {

  const packet = {
    user: { _id: playerId },
    message,
  }

  this.io.to(roomId).emit('USER_SPOKE', packet)
}

module.exports.userStartedMeditating = (roomId, playerId) => {
  this.io.to(roomId).emit('USER_STARTED_MEDITATING', { _id: playerId })
}

module.exports.userStoppedMeditating = (roomId, playerId) => {
  this.io.to(roomId).emit('USER_STOPPED_MEDITATING', { _id: playerId })
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

function parsePlayer(p) {

  const player = {
    _id: p._id,
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