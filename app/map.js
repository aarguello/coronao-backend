const utils = require('./utils')

module.exports.getRandomPosition    = getRandomPosition
module.exports.getNeighbourPosition = getNeighbourPosition
module.exports.checkCollision       = checkCollision
module.exports.positionInMap        = positionInMap
module.exports.getActor             = getActor
module.exports.pivotActor           = pivotActor
module.exports.moveActor            = moveActor
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

function checkCollision(position) {
  const data = global.map.positions[position]
  return data && (data.USER || data.NPC || data.TILE)
}

function positionInMap(position) {

  const checkX = 0 <= position[0] && position[0] < global.map.size
  const checkY = 0 <= position[1] && position[1] < global.map.size

  return checkX && checkY
}

function getActor(_id, type) {

  let actor

  if (type === 'USER') {
    actor = global.users[_id]
  }

  if (type === 'NPC') {
    actor = global.aliveNPCs[_id]
  }

  return actor
}

function pivotActor(type, _id, direction, emitter) {

  const actor = getActor(_id, type)

  if (!actor || actor.direction === direction) {
    return
  }

  actor.direction = direction
  emitter(actor._id, actor.direction)
}

function moveActor(type, _id, position, emitter) {

  const actor = getActor(_id, type)

  if (!actor || !positionInMap(position) || checkCollision(position)) {
    return
  }

  if (global.map.positions[actor.position]) {
    delete global.map.positions[actor.position][type]
  }

  actor.position = position

  if (position in global.map.positions) {
    global.map.positions[position][type] = actor._id
  } else {
    global.map.positions[position] = { [type]: actor._id }
  }

  if (emitter) {
    emitter(_id, position)
  }
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
