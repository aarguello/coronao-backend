const broadcast = require('../emitters')
const spellsHandler = require('../spells')

module.exports.initListener = initListener
module.exports.initBroadcast = initBroadcast

function initListener(socket, player) {

  socket.on('USER_MOVE', userMoveHandler)
  socket.on('USER_SPEAK', userSpeakHandler)
  socket.on('USER_ATTACK', userAttackHandler)
  socket.on('USER_MEDITATE', userMeditateHandler)
  socket.on('USER_USE_ITEM', userUseItemHandler)
  socket.on('USER_GRAB_ITEM', userGrabItemHandler)
  socket.on('USER_DROP_ITEM', userDropItemHandler)
  socket.on('USER_CAST_SPELL', userCastHandler)

  function userMoveHandler(direction, clientPrediction) {

    const directionValid = ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(direction)

    if (directionValid) {
      player.move(direction, clientPrediction)
    }
  }

  function userSpeakHandler(message) {
    player.speak(message)
  }

  function userAttackHandler() {
    player.attack()
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
    spellsHandler.call(player, spellId, position)
  }
}

function initBroadcast(socket, player, roomId) {
  player.events.on('ATTACKED', broadcast.userAttacked)
  player.events.on('SPOKE', broadcast.userSpoke)
  player.events.on('DIED', broadcast.userDied)
  player.events.on('REVIVED', broadcast.userRevived)
  player.events.on('DIRECTION_CHANGED', broadcast.userDirectionChanged)
  player.events.on('POSITION_CHANGED', broadcast.userPositionChanged.bind(null, socket))
  player.events.on('VISIBILITY_CHANGED', broadcast.userVisibilityChanged)
  player.events.on('INVENTORY_CHANGED', broadcast.userInventoryChanged)
  player.events.on('STAT_CHANGED', broadcast.userStatChanged)
  player.events.on('EQUIPED_ITEM', broadcast.userEquipedItem)
  player.events.on('UNEQUIPED_ITEM', broadcast.userUnequipedItem)
  player.events.on('STARTED_MEDITATING', broadcast.userStartedMeditating)
  player.events.on('STOPPED_MEDITATING', broadcast.userStoppedMeditating)
}