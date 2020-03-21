const utils = require('./utils')

module.exports.newConnection = (socket) => {

  const user = {
    _id: socket.id,
    HP: 100,
    color: utils.getRandomColor(),
    position: utils.getRandomPosition(),
  }

  global.users[socket.id] = user

  socket.on('disconnect', () => {
    delete global.users[socket.id]
  })

}