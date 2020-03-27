const Map = require('./map')

module.exports.initGlobals         = initGlobals
module.exports.getRandomInt        = getRandomInt
module.exports.getRandomClass      = getRandomClass
module.exports.getRandomRace       = getRandomRace
module.exports.getEquipementBonus  = getEquipementBonus

function initGlobals(io) {

  global.io        = io
  global.users     = {}
  global.aliveNPCs = {}

  global.baseDamage        = 100
  global.blowEffort        = 20
  global.meditateIncrement = 0.04
  global.inventorySize     = 9
  global.messageMaxLength  = 100

  global.intervals = {
    frozen: 5000,
    pathfinder: 1000,
    staminaRecover: 5000,
    meditate: 1000,
    invisibility: 8000,
  }

  global.map     = Map.load('./assets/map-1.json')
  global.classes = importJSONArrayAsDictionary('./assets/classes.json', 'name')
  global.races   = importJSONArrayAsDictionary('./assets/races.json',   'name')
  global.NPCs    = importJSONArrayAsDictionary('./assets/NPCs.json',    'name')
  global.items   = importJSONArrayAsDictionary('./assets/items.json',   '_id')
  global.spells  = importJSONArrayAsDictionary('./assets/spells.json',  '_id')
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

function getEquipementBonus(equipement, attribute) {

  const reducer = (total, itemId) => {

    let item = global.items[itemId]
    let value = 0

    if (item[attribute]) {
      value = utils.getRandomInt(
        item[attribute][0],
        item[attribute][1] + 1
      )
    }

    return total + value
  }

  return equipement.reduce(reducer, 0)
}

function importJSONArrayAsDictionary(path, key) {

  const array = require(path)

  const dict = array.reduce((currentDict, item) => {
    currentDict[item[key]] = item
    return currentDict
  }, {})

  return dict
}