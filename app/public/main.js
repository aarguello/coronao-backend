let socket = io()

socket.on('connect', () => {
  document.getElementById('socket_id').innerHTML = socket.id
})

function userMove(direction) {
  socket.emit('USER_MOVE_' + direction)
}

function userAttack() {
  socket.emit('USER_ATTACK')
}

socket.on('USER_POSITION_CHANGE', updatePosition)
socket.on('USER_WELCOME', updatePosition)

const onevent = socket.onevent

socket.onevent = function (packet) {
  console.log(packet.data)
  onevent.call(this, packet)
}

function updatePosition(data) {
  if (data._id === socket.id) {
    const x = data.position[0]
    const y = data.position[1]
    document.getElementById('user_position').innerHTML = `(${x}, ${y})`
  }
}