const utils = require('./utils')

const directions = ['LEFT', 'RIGHT', 'UP', 'DOWN']

module.exports.directions           = directions
module.exports.getRandomPosition    = getRandomPosition
module.exports.getNeighbourPosition = getNeighbourPosition
module.exports.getActorInTile       = getActorInTile
module.exports.getNearestUser       = getNearestUser
module.exports.checkCollision       = checkCollision
module.exports.positionInMap        = positionInMap
module.exports.updateActorPosition  = updateActorPosition
module.exports.load                 = load

function getRandomPosition() {

  const position = [
    utils.getRandomInt(0, global.map.size),
    utils.getRandomInt(0, global.map.size),
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

function getActorInTile(position) {

  const tile = global.map.positions[position] || {}

  if (tile.USER) {
    return global.users[tile.USER]
  } else if (tile.NPC) {
    return global.aliveNPCs[tile.NPC]
  }
}

function getNearestUser(position, fov) {

  let closest = {
    id: null,
    position: []
  }
  const type = "USER"

  Object.entries(global.map.positions).forEach(([pos, tile]) => {
    if (type in tile) {
      user = global.users[tile[type]]
      if (user.hp > 0) {
        pos = pos.split(',').map(Number)
        distanceBetween = getDistance(position, pos)
        if (distanceBetween <= fov && (distanceBetween < getDistance(position, closest.position) || !closest.id)) {
          closest.id = user
          closest.position = pos
        }
      }
    }
  })

  return closest.id
}

function checkCollision(position) {
  const data = global.map.positions[position]
  return data && (data.USER || data.NPC || data.TILE) || !positionInMap(position)
}

function positionInMap(position) {

  const checkX = 0 <= position[0] && position[0] < global.map.size
  const checkY = 0 <= position[1] && position[1] < global.map.size

  return checkX && checkY
}

function updateActorPosition(actor, position) {

  if (checkCollision(position)) {
    return
  }

  if (global.map.positions[actor.position]) {
    delete global.map.positions[actor.position][actor.type]
  }

  actor.position = position

  if (position in global.map.positions) {
    global.map.positions[position][actor.type] = actor._id
  } else {
    global.map.positions[position] = { [actor.type]: actor._id }
  }

  return true
}

function load(path) {

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
      writeCollisionOnMap(collisionLayers[j].data[i] - 1, i)
    }
  }

  function writeCollisionOnMap(tileId, index) {

    if (tileId === -1 || !collisionTiles[tileId]) {
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

function getDistance(P, Q) {

  const R = [
    P[0] - Q[0],
    P[1] - Q[1],
  ]

  return getNorm(R)
}

function getNorm(V) {
  return Math.sqrt(V[0] * V[0] + V[1] * V[1])
}
