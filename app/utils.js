const Map = require('./model/map')

module.exports.initGlobals       = initGlobals
module.exports.getRandomInt      = getRandomInt
module.exports.getRandomNPC      = getRandomNPC
module.exports.getequipmentBonus = getEquipmentBonus
module.exports.weightedRandom    = weightedRandom
module.exports.getInventory      = getInventoryByClass

function initGlobals() {

  global.users     = {}
  global.aliveNPCs = {}
  global.config    = require('./assets/config.json')

  const selectedMap = 'map-1'

  global.classes = importJSONArrayAsDictionary('./assets/classes.json', 'name')
  global.races   = importJSONArrayAsDictionary('./assets/races.json',   'name')
  global.NPCs    = importJSONArrayAsDictionary('./assets/NPCs.json',    'name')
  global.items   = importJSONArrayAsDictionary('./assets/items.json',   '_id')
  global.spells  = importJSONArrayAsDictionary('./assets/spells.json',  '_id')
  global.mapNPCs = importJSONArrayAsDictionary('./assets/mapNPCs.json',  'map')[selectedMap]

  global.intervals = require('./assets/intervals.json')
  for (let npc of Object.values(global.NPCs)) {
    global.intervals.npcMove[npc.name] = npc.movement_speed
    global.intervals.npcAttack[npc.name] = npc.attack_speed
  }

  global.map = new Map(selectedMap)
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

function getEquipmentBonus(equipment, attribute) {

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

function importJSONArrayAsDictionary(path, key) {

  const array = require(path)

  const dict = array.reduce((currentDict, item) => {
    currentDict[item[key]] = item
    return currentDict
  }, {})

  return dict
}