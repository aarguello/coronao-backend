const Map = require('./model/map')

module.exports.initGlobals         = initGlobals
module.exports.getRandomInt        = getRandomInt
module.exports.getRandomNPC        = getRandomNPC
module.exports.getequipmentBonus  = getequipmentBonus
module.exports.weightedRandom      = weightedRandom

function initGlobals() {

  global.users     = {}
  global.aliveNPCs = {}
  global.config    = require('./assets/config.json')
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

function getequipmentBonus(equipment, attribute) {

  const reducer = (total, item) => {

    let value = 0

    if (item[attribute]) {
      value = getRandomInt(
        item[attribute][0],
        item[attribute][1] + 1
      )
    }

    return total + value
  }

  return equipment.reduce(reducer, 0)
}

function importJSONArrayAsDictionary(path, key) {

  const array = require(path)

  const dict = array.reduce((currentDict, item) => {
    currentDict[item[key]] = item
    return currentDict
  }, {})

  return dict
}