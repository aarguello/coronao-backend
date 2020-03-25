module.exports.initGlobals          = initGlobals
module.exports.getRandomInt         = getRandomInt
module.exports.getRandomClass       = getRandomClass
module.exports.getRandomRace        = getRandomRace
module.exports.getRandomPosition    = getRandomPosition
module.exports.getNeighbourPosition = getNeighbourPosition
module.exports.checkCollision       = checkCollision
module.exports.positionInMap        = positionInMap

function initGlobals(io) {

  global.io        = io
  global.users     = {}
  global.aliveNPCs = {}

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

  if (checkCollision(position)) {
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
    positions: {},
    size: rawMap.width,
  }

  const collisionLayers = rawMap.layers.filter(l => l.name.startsWith('collision'))
  const collisionTiles  = rawMap.tilesets[0].tiles.map(t => (
    t.properties && t.properties.some(p => p.name === 'collides' && p.value)
  ))

  for (let i = 0; i < map.size * map.size; i++) {
    for (let j = 0; j < collisionLayers.length; j++) {
      writeCollisionOnMap(collisionLayers[j].data[i], i)
    }
  }

  function writeCollisionOnMap(tileId, index) {

    if (!collisionTiles[tileId]) {
      return
    }

    const position = [
      index % map.size,
      Math.floor(index / map.size),
    ]

    map.positions[position] = { TILE: tileId }
  }

  return map
}

function checkCollision(position) {
  const data = global.map.positions[position]
  return data && (data.USER || data.NPC || data.TILE)
}

function positionInMap(position) {

  const checkX = 0 <= position[0] && position[0] < global.map.size
  const checkY = 0 <= position[1] && position[1] < global.map.size

  return checkX && checkY
}