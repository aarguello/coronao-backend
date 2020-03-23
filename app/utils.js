module.exports.initGlobals          = initGlobals
module.exports.getRandomInt         = getRandomInt
module.exports.getRandomColor       = getRandomColor
module.exports.getRandomClass       = getRandomClass
module.exports.getRandomRace        = getRandomRace
module.exports.getRandomPosition    = getRandomPosition
module.exports.getNeighbourPosition = getNeighbourPosition
module.exports.getNeighbourUserId   = getNeighbourUserId

function initGlobals(io) {

  global.io = io
  global.users = {}
  global.positions = {}

  global.mapSize = 32
  global.baseDamage = 75
  global.staminaRequired = 0
  global.inventorySize = 9

  global.classes = importJSONArrayAsDictionary('./data/classes.json', 'name')
  global.races   = importJSONArrayAsDictionary('./data/races.json',   'name')
  global.items   = importJSONArrayAsDictionary('./data/items.json',   '_id')
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

function getRandomRace() {
  const raceNames = Object.keys(global.races)
  const raceNameIndex = getRandomInt(0, raceNames.length)
  const randomRaceName = raceNames[raceNameIndex]
  return global.races[randomRaceName]
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

function importJSONArrayAsDictionary(path, key) {

  const array = require(path)

  const dict = array.reduce((currentDict, item) => {
    currentDict[item[key]] = item
    return currentDict
  }, {})

  return dict
}