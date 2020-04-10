const Map = require('./model/map')

module.exports.initGlobals         = initGlobals
module.exports.getRandomInt        = getRandomInt
module.exports.getRandomBool       = getRandomBool
module.exports.getRandomNPC        = getRandomNPC
module.exports.getEquipementBonus  = getEquipementBonus
module.exports.arraysMatch         = arraysMatch
module.exports.weightedRandom      = weightedRandom

function initGlobals() {

  global.users     = {}
  global.aliveNPCs = {}

  global.baseDamage        = 100
  global.blowEffort        = 20
  global.meditateIncrement = 0.04
  global.staminaIncrement  = 40
  global.inventorySize     = 9
  global.messageMaxLength  = 100

  global.config = require('./assets/config.json')

  global.intervals = require('./assets/intervals.json')

  const selectedMap = 'map-1'
  global.map     = new Map(selectedMap)
  global.classes = importJSONArrayAsDictionary('./assets/classes.json', 'name')
  global.races   = importJSONArrayAsDictionary('./assets/races.json',   'name')
  global.NPCs    = importJSONArrayAsDictionary('./assets/NPCs.json',    'name')
  global.items   = importJSONArrayAsDictionary('./assets/items.json',   '_id')
  global.spells  = importJSONArrayAsDictionary('./assets/spells.json',  '_id')
  global.mapNPCs = importJSONArrayAsDictionary('./assets/mapNPCs.json',  'map')[selectedMap]
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

function getRandomBool(falseProbability) {
  return Math.random() >= falseProbability
}

function getRandomNPC() {
  npcProbs = global.mapNPCs['spawnProbabilities']
  randomNPCName = weightedRandom(npcProbs)
  return global.NPCs[randomNPCName]
}

function weightedRandom(prob) {
  let i, sum=0, r=Math.random()
  for (i in prob) {
    sum += prob[i]
    if (r <= sum) return i
  }
}

function getEquipementBonus(equipement, attribute) {

  const reducer = (total, itemId) => {

    let item = global.items[itemId]
    let value = 0

    if (item[attribute]) {
      value = getRandomInt(
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

function arraysMatch(arr1, arr2) {

  if (arr1.length !== arr2.length) return false

  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }

  return true
}
