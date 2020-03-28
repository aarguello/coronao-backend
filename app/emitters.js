

let io

module.exports.setIO = (IO) => io = IO

module.exports.userWelcome = (user) => {

  const globals = {
    users: global.users,
    items: global.items,
    spells: global.spells,
    mapSize: global.map.size,
    aliveNPCs: global.aliveNPCs,
    inventorySize :global.inventorySize,
  }

  io.to(user._id).emit('USER_WELCOME', { user, globals })
}

module.exports.userJoined = (user, socket) => {
  socket.broadcast.emit('USER_JOINED', user)
}

module.exports.userLeft = (_id) => {
  io.emit('USER_LEFT', { _id })
}

module.exports.userPositionChanged = (_id, position) => {
  io.emit('USER_POSITION_CHANGED', { _id, position })
}

module.exports.userDirectionChanged = (_id, direction) => {
  io.emit('USER_DIRECTION_CHANGED', { _id, direction })
}

module.exports.userAttacked = (_id, damage) => {
  io.emit('USER_ATTACKED', { user: { _id }, damage })
}

module.exports.userMissedAttack = (_id) => {
  io.emit('USER_MISSED_ATTACK', { _id })
}

module.exports.userReceivedSpell = (_id, spellId) => {
  io.emit('USER_RECEIVED_SPELL', { user: { _id }, spellId })
}

module.exports.userStatChanged = (_id, stat, value) => {
  io.emit(`USER_STAT_CHANGED`, { _id, stats: { [stat]: value } })
}

module.exports.userVisibilityChanged = (_id, invisible) => {
  io.emit(`USER_VISIBILITY_CHANGED`, { _id, invisible })
}

module.exports.userEquipedItem = (_id, itemId) => {
  io.emit('USER_EQUIPED_ITEM', { user: { _id }, itemId })
}

module.exports.userUnequipedItem = (_id, itemId) => {
  io.emit('USER_UNEQUIPED_ITEM', { user: { _id }, itemId })
}

module.exports.userDied = (_id) => {
  io.emit('USER_DIED', { _id })
}

module.exports.userRevived = (_id) => {
  io.emit('USER_REVIVED', { _id })
}

module.exports.userSpoke = (_id, message) => {
  io.emit('USER_SPOKE', { user: { _id }, message})
}

module.exports.userStartedMeditating = (_id) => {
  io.emit('USER_STARTED_MEDITATING', { _id })
}

module.exports.userStoppedMeditating = (_id) => {
  io.emit('USER_STOPPED_MEDITATING', { _id })
}

module.exports.npcSpawned = (npc) => {
  io.emit('NPC_SPAWNED', npc)
}

module.exports.npcDied = (_id) => {
  io.emit('NPC_DIED', { _id })
}

module.exports.npcPositionChanged = (_id, position) => {
  io.emit('NPC_POSITION_CHANGED', { _id, position })
}

module.exports.npcDirectionChanged = (_id, direction) => {
  io.emit('NPC_DIRECTION_CHANGED', { _id, direction })
}

module.exports.npcStatChanged = (_id, stat, value) => {
  io.emit(`NPC_STAT_CHANGED`, { _id, stats: { [stat]: value } })
}

module.exports.npcReceivedSpell = (_id, spellId) => {
  io.emit('NPC_RECEIVED_SPELL', { npc: { _id }, spellId })
}