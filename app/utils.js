module.exports.initGlobals          = initGlobals
module.exports.getRandomColor       = getRandomColor
module.exports.getRandomPosition    = getRandomPosition
module.exports.getNeighbourPosition = getNeighbourPosition
module.exports.getNeighbourUserId   = getNeighbourUserId

function initGlobals(io) {
  global.io = io
  global.users = {}
  global.positions = {}
  global.items = loadItems('./data/items.json')
  global.mapSize = 32
  global.attackDamage = 15
  global.staminaRequired = 25
  global.inventorySize = 9
}

function getRandomColor() {
  const colors = ['blue', 'red', 'green', 'violet', 'yellow']
  const i = getRandomInt(0, colors.length)
  return colors[i]
}

function getRandomPosition() {

  const position = [
    getRandomInt(0, global.mapSize),
    getRandomInt(0, global.mapSize),
  ]

  if (global.positions[position]) {
    return getRandomPosition()
  }

  return position
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

function getNeighbourPosition(position, direction) {
  if (direction === 'LEFT')  return [position[0] - 1, position[1]]
  if (direction === 'RIGHT') return [position[0] + 1, position[1]]
  if (direction === 'UP')    return [position[0]    , position[1] - 1]
  if (direction === 'DOWN')  return [position[0]    , position[1] + 1]
}

function getNeighbourUserId(user) {
  const neighbourPosition = getNeighbourPosition(user.position, user.direction)
  return global.positions[neighbourPosition]
}

function loadItems(itemsPath) {

  const itemsArray = require(itemsPath)

  const items = itemsArray.reduce((dict, item) => {
    dict[item._id] = item
    return dict
  }, {})

  return items
}