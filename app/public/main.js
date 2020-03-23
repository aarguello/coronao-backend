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

socket.onevent = function (packet) {
  console.log(packet.data[0], packet.data[1])
}