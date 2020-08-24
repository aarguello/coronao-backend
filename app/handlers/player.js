const broadcast = require('../emitters')
const spellsHandler = require('../spells')
const Map = require('../model/map')

module.exports.initListener = initListener
module.exports.initBroadcast = initBroadcast

function initListener(room, player, socket) {

  socket.on('REQUEST_GAME_STATE', gameStateHandler)

  socket.on('USER_MOVE', userMoveHandler)
  socket.on('USER_SPEAK', userSpeakHandler)
  socket.on('USER_ATTACK', userAttackHandler)
  socket.on('USER_MEDITATE', userMeditateHandler)
  socket.on('USER_USE_ITEM', userUseItemHandler)
  socket.on('USER_GRAB_ITEM', userGrabItemHandler)
  socket.on('USER_DROP_ITEM', userDropItemHandler)
  socket.on('USER_CAST_SPELL', userCastHandler)

  socket.use((_, next) => {
    if (room.status === 'INGAME') {
      next()
    }
  })

  function gameStateHandler() {
    broadcast.gameState(this.id, room.players, {}, room.map.items())
  }

  function userMoveHandler(direction, clientPrediction) {

    const directionValid = ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(direction)

    if (directionValid) {
      player.move(room.map, direction, clientPrediction)
    }
  }

  function userSpeakHandler(message) {

    if (typeof message !== 'string') {
      return
    }

    player.speak(message)
  }

  function userAttackHandler() {

    const neighbour = Map.neighbour(player.position, player.direction)
    const target = room.map.getActor(neighbour)

    player.attack(target)
  }

  function userMeditateHandler() {
    player.meditate()
  }

  function userUseItemHandler(itemId) {

    const item = global.items[itemId]

    if (item) {
      player.useItem(item)
    }
  }

  function userGrabItemHandler() {
    player.grabItem(room.map)
  }

  function userDropItemHandler(itemId, quantity) {
    player.dropItem(room.map, itemId, quantity)
  }

  function userCastHandler(spellId, position) {
    spellsHandler.cast(room, player, spellId, position)
  }
}

function initBroadcast(room, player, socket) {

  const roomId = room._id

  player.events.on('ATTACKED', (playerId, damage) => {
    broadcast.userAttacked(roomId, playerId, damage)
  })

  player.events.on('SPOKE', (playerId, message) => {
    broadcast.userSpoke(roomId, playerId, message)
  })

  player.events.on('DIED', (playerId) => {
    broadcast.userDied(roomId, playerId)
  })

  player.events.on('REVIVED', (playerId) => {
    broadcast.userRevived(roomId, playerId)
  })

  player.events.on('DIRECTION_CHANGED', (playerId, direction) => {
    broadcast.userDirectionChanged(roomId, playerId, direction)
  })

  player.events.on('POSITION_CHANGED', (playerId, position, clientPrediction) => {
    broadcast.userPositionChanged(roomId, playerId, socket, position, clientPrediction)
  })

  player.events.on('VISIBILITY_CHANGED', (playerId, invisible) => {
    broadcast.userVisibilityChanged(roomId, playerId, invisible)
  })

  player.events.on('INVENTORY_CHANGED', (playerId, itemId, amount) => {
    broadcast.userInventoryChanged(roomId, playerId, itemId, amount)
  })

  player.events.on('INVENTORY_DROP', (_, position, items) => {
    room.map.addItems(position, items)
    broadcast.userCombatStatsChanged(socket.id, player)
  })

  player.events.on('STAT_CHANGED', (playerId, stat, value) => {
    broadcast.userStatChanged(roomId, playerId, stat, value)
  })

  player.events.on('EQUIPED_ITEM', (playerId, itemId) => {
    broadcast.userEquipedItem(roomId, playerId, itemId)
    broadcast.userCombatStatsChanged(socket.id, player)
  })

  player.events.on('UNEQUIPED_ITEM', (playerId, itemId) => {
    broadcast.userUnequipedItem(roomId, playerId, itemId)
    broadcast.userCombatStatsChanged(socket.id, player)
  })

  player.events.on('STARTED_MEDITATING', (playerId) => {
    broadcast.userStartedMeditating(roomId, playerId)
  })

  player.events.on('STOPPED_MEDITATING', (playerId) => {
    broadcast.userStoppedMeditating(roomId, playerId)
  })
}