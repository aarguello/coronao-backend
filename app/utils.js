
module.exports.getRandomColor = () => {
  const colors = ['blue', 'red', 'green', 'violet', 'yellow']
  const i = getRandomInt(0, colors.length)
  return colors[i]
}

module.exports.getRandomPosition = () => {

  let position = {
   x: getRandomInt(0, global.mapSize),
   y: getRandomInt(0, global.mapSize),
  }

  let exists = Object.values(global.users).find(user =>
    user.position.x === position.x && user.position.y === position.y
  )

  if (exists) {
    position = getRndPosition(true)
  }

  return position
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}
