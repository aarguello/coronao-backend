module.exports.initGlobals          = initGlobals
module.exports.getRandomInt         = getRandomInt
module.exports.getRandomClass       = getRandomClass
module.exports.getRandomRace        = getRandomRace
module.exports.getRandomPosition    = getRandomPosition
module.exports.getNeighbourPosition = getNeighbourPosition
module.exports.getNeighbourUserId   = getNeighbourUserId

function initGlobals(io) {

  global.io        = io
  global.users     = {}
  global.aliveNPCs = {}
  global.positions = {}

  global.mapSize          = 32
  global.baseDamage       = 100
  global.staminaRequired  = 20
  global.inventorySize    = 9
  global.messageMaxLength = 100

  global.intervals = {
    frozen: 5000,
    pathfinder: 1000,
    staminaRecover: 5000,
  }

  global.map     = importMap('./data/map-1.json')
  global.classes = importJSONArrayAsDictionary('./data/classes.json', 'name')
  global.races   = importJSONArrayAsDictionary('./data/races.json',   'name')
  global.NPCs    = importJSONArrayAsDictionary('./data/NPCs.json',    'name')
  global.items   = importJSONArrayAsDictionary('./data/items.json',   '_id')
  global.spells  = importJSONArrayAsDictionary('./data/spells.json',  '_id')
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
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
    getRandomInt(0, global.map.size),
    getRandomInt(0, global.map.size),
  ]

  if (global.positions[position] || global.map.collisions[position]) {
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

function importMap(path) {

  const rawMap = require(path)

  const map = {
    collisions: {},
    positions: {},
    size: rawMap.width,
  }

  const collisions = rawMap.tilesets[0].tiles.map(t => (
    t.properties && t.properties.some(p => p.name === 'collides' && p.value)
  ))

  const reducer = (map, tile, i) => {

    if (collisions[i]) {

      const position = [
        Math.floor(i / map.size),
        i % map.size,
      ]

      map.collisions[position] = true
      map.positions[position] = { type: 'tile', collides: true }
    }

    return map
  }

  return rawMap.layers
               .find(layer => layer.name === 'collision-1')
               .data
               .reduce(reducer, map)
}