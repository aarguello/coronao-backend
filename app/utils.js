
module.exports.getRandomColor = () => {
  const colors = ['blue', 'red', 'green', 'violet', 'yellow']
  const i = getRandomInt(0, colors.length)
  return colors[i]
}

module.exports.getRandomPosition = () => {
  const x = getRandomInt(0, global.mapSize)
  const y = getRandomInt(0, global.mapSize)
  return {x, y}
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}