const Map = require('./map')

module.exports.initGlobals    = initGlobals
module.exports.getRandomInt   = getRandomInt
module.exports.getRandomClass = getRandomClass
module.exports.getRandomRace  = getRandomRace

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

  global.map     = Map.load('./data/map-1.json')
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

function importJSONArrayAsDictionary(path, key) {

  const array = require(path)

  const dict = array.reduce((currentDict, item) => {
    currentDict[item[key]] = item
    return currentDict
  }, {})

  return dict
}