
module.exports.setIO = (io) => this.io = io

module.exports.userJoinedGameRoom = (userId, gameRoom) => {

  const user = { _id: userId }
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

module.exports.userLeftGameRoom = (userId, roomId) => {
  this.io.to(roomId).emit('USER_LEFT_GAME_ROOM', userId, roomId)
}

module.exports.gameStateNew = (roomId, players, NPCs, items) => {

  const users = {}

  for (const [userId, u] of Object.entries(players)) {
    users[userId] = parseUser(u)
  }

  this.io.to(roomId).emit('GAME_STATE', { users, NPCs, items })
}

module.exports.gameState = (socket) => {

  const users = {}
  const NPCs = global.aliveNPCs
  const items = global.map.items()

  for (const [userId, u] of Object.entries(global.users)) {
    users[userId] = parseUser(u)
  }

  socket.emit('GAME_STATE', { users, NPCs, items })
}

module.exports.userJoined = (user, socket) => {
  socket.broadcast.emit('USER_JOINED', parseUser(user))
}

module.exports.userLeft = (_id) => {
  this.io.emit('USER_LEFT', { _id })
}

module.exports.userPositionChanged = (socket, _id, position, index) => {
  this.io.to(socket.id).emit('USER_POSITION_CHANGED', { _id, position, index })
  socket.broadcast.emit('USER_POSITION_CHANGED', { _id, position })
}

module.exports.userDirectionChanged = (_id, direction) => {
  this.io.emit('USER_DIRECTION_CHANGED', { _id, direction })
}

module.exports.userInventoryChanged = (_id, itemId, amount) => {
  this.io.emit('USER_INVENTORY_CHANGED', { _id, inventory : { [itemId]: amount } })
}

module.exports.userAttacked = (_id, damage) => {
  this.io.emit('USER_ATTACKED', { user: { _id }, damage })
}

module.exports.userReceivedSpell = (_id, spellId) => {
  this.io.emit('USER_RECEIVED_SPELL', { user: { _id }, spellId })
}

module.exports.userStatChanged = (_id, stat, value) => {
  this.io.emit(`USER_STAT_CHANGED`, { _id, stats: { [stat]: value } })
}

module.exports.userVisibilityChanged = (_id, invisible) => {
  this.io.emit(`USER_VISIBILITY_CHANGED`, { _id, invisible })
}

module.exports.userEquipedItem = (_id, itemId) => {
  this.io.emit('USER_EQUIPED_ITEM', { user: { _id }, itemId })
}

module.exports.userUnequipedItem = (_id, itemId) => {
  this.io.emit('USER_UNEQUIPED_ITEM', { user: { _id }, itemId })
}

module.exports.userDied = (_id) => {
  this.io.emit('USER_DIED', { _id })
}

module.exports.userRevived = (_id) => {
  this.io.emit('USER_REVIVED', { _id })
}

module.exports.userSpoke = (_id, message) => {
  this.io.emit('USER_SPOKE', { user: { _id }, message })
}

module.exports.userStartedMeditating = (_id) => {
  this.io.emit('USER_STARTED_MEDITATING', { _id })
}

module.exports.userStoppedMeditating = (_id) => {
  this.io.emit('USER_STOPPED_MEDITATING', { _id })
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

module.exports.tileItemChanged = (position, itemId, quantity) => {
  this.io.emit('TILE_ITEM_CHANGED', { position, itemId, quantity })
}

function parseUser(u) {

  const user = {
    _id: u._id,
    name: u.name,
    race: u.race.name,
    class: u.class.name,
    stats: u.stats,
    spells: u.spells,
    position: u.position,
    intervals: u.intervals,
    inventory: u.inventory,
    equipment: u.equipment.map(i => i._id),
  }

  return user
}