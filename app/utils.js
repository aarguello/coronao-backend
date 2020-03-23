module.exports.initGlobals          = initGlobals
module.exports.getRandomInt         = getRandomInt
module.exports.getRandomColor       = getRandomColor
module.exports.getRandomClass       = getRandomClass
module.exports.getRandomPosition    = getRandomPosition
module.exports.getNeighbourPosition = getNeighbourPosition
module.exports.getNeighbourUserId   = getNeighbourUserId

function initGlobals(io) {
  global.io = io
  global.users = {}
  global.positions = {}
  global.items = loadItems('./data/items.json')
  global.classes = loadClasses('./data/classes.json')
  global.mapSize = 32
  global.baseDamage = 75
  global.staminaRequired = 0
  global.inventorySize = 9
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

function getRandomColor() {
  const colors = ['blue', 'red', 'green', 'violet', 'yellow']
  const i = getRandomInt(0, colors.length)
  return colors[i]
}

function getRandomClass() {
  const classNames = Object.keys(global.classes)
  const classNameIndex = getRandomInt(0, classNames.length)
  const randomClassName = classNames[classNameIndex]
  return global.classes[randomClassName]
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

function loadClasses(classesPath) {

  const classesArray = require(classesPath)

  const classes = classesArray.reduce((dict, currentClass) => {
    dict[currentClass.name] = currentClass
    return dict
  }, {})

  return classes
}