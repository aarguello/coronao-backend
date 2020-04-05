const jwt       = require('jsonwebtoken')
const User      = require('./user')
const Map       = require('./map')
const broadcast = require('./emitters')
const combat    = require('./combat')

module.exports.login      = login
module.exports.connection = connection

function login(request, response) {

  const name   = request.body.name
  const race   = request.body.race  || 'HUMAN'
  const class_ = request.body.class || 'BARD'

  if (!name || name in global.users) {
    response.status(400)
    response.send({ error: 'USERNAME_TAKEN' })
    return
  }

  if (!global.races[race]) {
    response.status(400)
    response.send({ error: 'RACE_NOT_FOUND' })
    return
  }

  if (!global.classes[class_]) {
    response.status(400)
    response.send({ error: 'CLASS_NOT_FOUND' })
    return
  }

  const payload = {
    name:  name,
    race:  race,
    class: class_,
  }

  response.status(200)
  response.send({
    token:         jwt.sign(payload, process.env.JWT_SECRET),
    items:         global.items,
    spells:        global.spells,
    mapSize:       global.map.size,
    intervals:     global.intervals,
    inventorySize: global.inventorySize,
  })
}

function connection(socket) {

  let user = global.users[socket.decoded_token.name]

  if (!user) {

    user = new User(
      socket.decoded_token.name,
      global.races[socket.decoded_token.race],
      global.classes[socket.decoded_token.class]
    )

    global.users[user._id] = user
    Map.updateActorPosition(user, Map.getRandomPosition())
  }

  injectIntervals(socket)
  initHandlers(socket, user)
  initBroadcast(user)

  socket.on('disconnect', disconnect)

  broadcast.userWelcome(user, socket)
  broadcast.userJoined(user, socket)
}

function disconnect() {

  const user = global.users[this.decoded_token.name]

  if (user) {
    delete global.map.positions[user.position].USER
    delete global.users[user._id]
    broadcast.userLeft(user._id)
  }
}

function initHandlers(socket, user) {

  const directionValidator = (direction) => ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(direction)

  const userMoveHandler     = (dir) => directionValidator(dir) && user.move(dir)
  const userSpeakHandler    = (msg) => user.speak(msg)
  const userAttackHandler   = ()    => user.attack()
  const userMeditateHandler = ()    => user.meditate()
  const userToggleHandler   = (_id) => user.toggleItem(_id)
  const userCastHandler     = combat.handleSpell.bind(user)

  socket.on('USER_MOVE',        userMoveHandler,     global.intervals.userMove)
  socket.on('USER_SPEAK',       userSpeakHandler,    global.intervals.userSpeak)
  socket.on('USER_ATTACK',      userAttackHandler,   global.intervals.userAttack)
  socket.on('USER_MEDITATE',    userMeditateHandler, global.intervals.userMeditate)
  socket.on('USER_TOGGLE_ITEM', userToggleHandler,   global.intervals.userToggleItem)
  socket.on('USER_CAST_SPELL',  userCastHandler,     global.intervals.userCastSpell)
}

function initBroadcast(user) {
  user.on('ATTACKED',           broadcast.userAttacked)
  user.on('SPOKE',              broadcast.userSpoke)
  user.on('DIED',               broadcast.userDied)
  user.on('REVIVED',            broadcast.userRevived)
  user.on('DIRECTION_CHANGED',  broadcast.userDirectionChanged)
  user.on('POSITION_CHANGED',   broadcast.userPositionChanged)
  user.on('VISIBILITY_CHANGED', broadcast.userVisibilityChanged)
  user.on('INVENTORY_CHANGED',  broadcast.userInventoryChanged)
  user.on('STAT_CHANGED',       broadcast.userStatChanged)
  user.on('EQUIPED_ITEM',       broadcast.userEquipedItem)
  user.on('UNEQUIPED_ITEM',     broadcast.userUnequipedItem)
  user.on('STARTED_MEDITATING', broadcast.userStartedMeditating)
  user.on('STOPPED_MEDITATING', broadcast.userStoppedMeditating)
}

function injectIntervals(socket) {

  const on = socket.on

  socket.on = (action, handler, interval) => {

    if (interval) {

      // Assume the packet took at least this time to arrive
      let PING_CORRECTION = 15

      let last = Date.now()
      let original = handler

      handler = (...args) => {

        const now = Date.now()
        const elapsed = now - last

        if (elapsed >= interval - PING_CORRECTION) {
          original(...args)
          last = now
        } else {
          console.log(`${action} blocked. Try again in ${interval - elapsed}ms`);
        }
      }
    }

    on.call(socket, action, handler)
  }
}