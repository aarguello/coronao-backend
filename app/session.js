const jwt       = require('jsonwebtoken')
const User      = require('./model/user')
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
    inventorySize: global.config.user.inventorySize,
  })
}

function connection(socket) {

  let payload = socket.decoded_token
  let user = global.users[payload.name]

  if (!user) {
    user = createUser(payload.name, payload.race, payload.class)
    initHandlers(user, socket)
    initBroadcasts(user, socket)
  }

  injectIntervals(socket)

  socket.on('disconnect', disconnect)

  broadcast.userWelcome(user, socket)
  broadcast.userJoined(user, socket)
}

function createUser(name, race, class_) {

  const position = global.map.randomPosition()

  const user = new User(
    name,
    global.races[race],
    global.classes[class_],
    global.config.user,
  )

  user.position = position

  global.users[user._id] = user
  global.map.moveActor(user, null, position)

  return user
}

function disconnect() {

  const user = global.users[this.decoded_token.name]

  if (user) {
    global.map.removeActor(user)
    delete global.users[user._id]
    broadcast.userLeft(user._id)
  }
}

function initHandlers(user, socket) {

  const directionValidator = (direction) => ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(direction)

  const userMoveHandler     = (dir, i) => directionValidator(dir) && user.move(dir, i)
  const userSpeakHandler    = (msg)    => user.speak(msg)
  const userAttackHandler   = ()       => user.attack()
  const userMeditateHandler = ()       => user.meditate()
  const userToggleHandler   = (_id)    => user.toggleItem(_id)
  const userCastHandler     = combat.handleSpell.bind(user)

  socket.on('USER_MOVE',        userMoveHandler,     global.intervals.userMove)
  socket.on('USER_SPEAK',       userSpeakHandler,    global.intervals.userSpeak)
  socket.on('USER_ATTACK',      userAttackHandler,   global.intervals.userAttack)
  socket.on('USER_MEDITATE',    userMeditateHandler, global.intervals.userMeditate)
  socket.on('USER_TOGGLE_ITEM', userToggleHandler,   global.intervals.userToggleItem)
  socket.on('USER_CAST_SPELL',  userCastHandler,     global.intervals.userCastSpell)
}

function initBroadcasts(user, socket) {
  user.events.on('ATTACKED',           broadcast.userAttacked)
  user.events.on('SPOKE',              broadcast.userSpoke)
  user.events.on('DIED',               broadcast.userDied)
  user.events.on('REVIVED',            broadcast.userRevived)
  user.events.on('DIRECTION_CHANGED',  broadcast.userDirectionChanged)
  user.events.on('POSITION_CHANGED',   broadcast.userPositionChanged.bind(null, socket))
  user.events.on('VISIBILITY_CHANGED', broadcast.userVisibilityChanged)
  user.events.on('INVENTORY_CHANGED',  broadcast.userInventoryChanged)
  user.events.on('STAT_CHANGED',       broadcast.userStatChanged)
  user.events.on('EQUIPED_ITEM',       broadcast.userEquipedItem)
  user.events.on('UNEQUIPED_ITEM',     broadcast.userUnequipedItem)
  user.events.on('STARTED_MEDITATING', broadcast.userStartedMeditating)
  user.events.on('STOPPED_MEDITATING', broadcast.userStoppedMeditating)
}

function injectIntervals(socket) {

  const on = socket.on

  socket.on = (action, handler, interval) => {

    if (interval) {

      // Assume the packet took at least this time to arrive
      let PING_CORRECTION = 40

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