const jwt       = require('jsonwebtoken')
const User      = require('./model/user')
const broadcast = require('./emitters')
const spells    = require('./spells')
const store     = require('./store')
const bcrypt    = require('bcrypt')
const socketIoJWT = require('socketio-jwt')

module.exports.register   = register
module.exports.login      = login
module.exports.init       = init

function init(io) {

  const JWT = socketIoJWT.authorize({
    secret: process.env.JWT_SECRET,
    handshake: true,
  })

  io.origins((_, callback) => { callback(null, true) })
  io.use(JWT)
  io.on('connection', handleConnection)
}

async function register(request, response) {

  const username = request.body.username || ''
  const password = request.body.password || ''

  const usernameValidator = /^(?=.{3,10}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/
  const passwordValidator = /^(?=.{5,12}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/

  if (typeof username !== 'string' || !usernameValidator.test(username)) {
    response.status(400)
    response.send({ error: 'INVALID_USERNAME' })
    return
  }

  if (typeof password !== 'string' || !passwordValidator.test(password)) {
    response.status(400)
    response.send({ error: 'INVALID_PASSWORD' })
    return
  }

  const users$ = store.db.collection('users')
  const exists = await users$.findOne({ username })

  if (exists) {
    response.status(400)
    response.send({ error: 'USERNAME_EXISTS' })
    return
  }

  try {

    const r = await users$.insertOne({
      username,
      password: await bcrypt.hash(password, 10),
    })

    response.send({ _id: r.insertedId })
    response.status(200)

  } catch (err) {
    response.send({ error: 'UNEXPECTED_ERROR' })
  }
}

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
    _id:           name,
    token:         jwt.sign(payload, process.env.JWT_SECRET),
    items:         global.items,
    spells:        global.spells,
    mapSize:       global.map.size,
    intervals:     global.intervals,
    inventorySize: global.config.user.inventorySize,
  })
}

function handleConnection(socket) {

  let payload = socket.decoded_token
  let user = global.users[payload.name]

  if (!user) {
    user = createUser(payload.name, payload.race, payload.class)
    initHandlers(user, socket)
    initBroadcasts(user, socket)
  }

  injectIntervals(socket)

  socket.on('disconnect', disconnect)

  broadcast.userWelcome(user._id, socket)
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
  user.inventory = getInventoryByClass(class_)

  global.users[user._id] = user
  global.map.moveActor(user, null, position)

  return user
}

function disconnect() {

  const user = global.users[this.decoded_token.name]

  if (user) {
    global.map.removeActor(user.position)
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
  const userUseItemHandler  = (_id)    =>  _id in global.items && user.useItem(global.items[_id])
  const userGrabItemHandler = (_id)    => user.grabItem(_id)
  const userDropItemHandler = (_id, qty) => user.dropItem(_id, qty)
  const userCastHandler     = spells.cast.bind(user)

  socket.on('USER_MOVE',       userMoveHandler,     global.intervals.userMove)
  socket.on('USER_SPEAK',      userSpeakHandler,    global.intervals.userSpeak)
  socket.on('USER_ATTACK',     userAttackHandler,   global.intervals.userAttack)
  socket.on('USER_MEDITATE',   userMeditateHandler, global.intervals.userMeditate)
  socket.on('USER_USE_ITEM',   userUseItemHandler,  global.intervals.userToggleItem)
  socket.on('USER_GRAB_ITEM',  userGrabItemHandler, global.intervals.userToggleItem)
  socket.on('USER_DROP_ITEM',  userDropItemHandler, global.intervals.userToggleItem)
  socket.on('USER_CAST_SPELL', userCastHandler,     global.intervals.userCastSpell)
}

function initBroadcasts(user, socket) {

  socket.on('REQUEST_GAME_STATE', () => broadcast.gameState(socket))

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

function getInventoryByClass(class_) {

  const reds = { 'p024Y6sJFnb9IfDVFgkS': 500 }
  const blues = { 'vBFVyGsUj9beNGjmJpVi': 500 }

  const physical = {
    'Wq0HhjkjN5zR8N8DENZF': 1,
    'jXnfxBE01Hx3YsTTi734': 1,
    '8Z5Fzc9t3VAQotaaZEag': 1,
    'G21gfv4T2YijDaTR0UVh': 1,
  }

  const magical = {
    'H07mwFXaKeuULQvOOkEv': 1,
    'XD0VuskON97LFPG0kdct': 1,
    'J0ldZPPAL2FZg1eqUS4T': 1,
    '2DuoNlOe5SlgANpeFvzo': 1,
  }

  const inventories = {
    'MAGE': { ...magical, ...blues, ...reds },
    'BARD': { ...magical, ...physical, ...blues, ...reds },
    'PALADIN': { ...physical, ...blues, ...reds },
    'WARRIOR': { ...physical, ...reds },
  }

  return inventories[class_]
}