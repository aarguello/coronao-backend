const broadcast = require('../emitters')
const spellsHandler = require('../spells')

module.exports.initListener = initListener
module.exports.initBroadcast = initBroadcast

function initListener(room, accountId, player, socket) {

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
    broadcast.gameState(this.id, room.players, {}, {})
  }

  function userMoveHandler(direction, clientPrediction) {

    const directionValid = ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(direction)

    if (directionValid) {
      player.move(direction, clientPrediction)
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
    player.grabItem()
  }

  function userDropItemHandler(itemId, quantity) {
    player.dropItem(itemId, quantity)
  }

  function userCastHandler(spellId, position) {
    spellsHandler.call(room._id, accountId, player, spellId, position)
  }
}

function initBroadcast(roomId, accountId, player, socket) {

  player.events.on('ATTACKED', (_, damage) => {
    broadcast.userAttacked(roomId, accountId, damage)
  })

  player.events.on('SPOKE', (_, message) => {
    broadcast.userSpoke(roomId, accountId, message)
  })

  player.events.on('DIED', () => {
    broadcast.userDied(roomId, accountId)
  })

  player.events.on('REVIVED', () => {
    broadcast.userRevived(roomId, accountId)
  })

  player.events.on('DIRECTION_CHANGED', (_, direction) => {
    broadcast.userDirectionChanged(roomId, accountId, direction)
  })

  player.events.on('POSITION_CHANGED', (_, position, clientPrediction) => {
    broadcast.userPositionChanged(roomId, accountId, socket, position, clientPrediction)
  })

  player.events.on('VISIBILITY_CHANGED', (_, invisible) => {
    broadcast.userVisibilityChanged(roomId, accountId, invisible)
  })

  player.events.on('INVENTORY_CHANGED', (_, itemId, amount) => {
    broadcast.userInventoryChanged(roomId, accountId, itemId, amount)
  })

  player.events.on('STAT_CHANGED', (_, stat, value) => {
    broadcast.userStatChanged(roomId, accountId, stat, value)
  })

  player.events.on('EQUIPED_ITEM', (_, itemId) => {
    broadcast.userEquipedItem(accountId, roomId, itemId)
  })

  player.events.on('UNEQUIPED_ITEM', (_, itemId) => {
    broadcast.userUnequipedItem(accountId, roomId, itemId)
  })

  player.events.on('STARTED_MEDITATING', () => {
    broadcast.userStartedMeditating(accountId, roomId)
  })

  player.events.on('STOPPED_MEDITATING', () => {
    broadcast.userStoppedMeditating(accountId, roomId)
  })
}