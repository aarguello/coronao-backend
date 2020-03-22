
module.exports.getRandomColor       = getRandomColor
module.exports.getRandomPosition    = getRandomPosition
module.exports.getNeighbourPosition = getNeighbourPosition
module.exports.getNeighbourUserId   = getNeighbourUserId

function getRandomColor() {
  const colors = ['blue', 'red', 'green', 'violet', 'yellow']
  const i = getRandomInt(0, colors.length)
  return colors[i]
}

function getRandomPosition() {

  let x = getRandomInt(0, global.mapSize)
  let y = getRandomInt(0, global.mapSize)

  if (global.positions[[x, y]]) {
    return getRandomPosition()
  }

  return {x, y}
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

function getNeighbourPosition(position, direction) {
  if (direction === 'LEFT')  return { x: position.x - 1, y: position.y }
  if (direction === 'RIGHT') return { x: position.x + 1, y: position.y }
  if (direction === 'UP')    return { x: position.x,     y: position.y - 1 }
  if (direction === 'DOWN')  return { x: position.x,     y: position.y + 1 }
}

function getNeighbourUserId(user) {
  const neighbourPosition = getNeighbourPosition(user.position, user.direction)
  return global.positions[[neighbourPosition.x, neighbourPosition.y]]
}