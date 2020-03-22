let socket = io()

socket.on('connect', () => {
  document.getElementById('socket_id').innerHTML = socket.id
})

<<<<<<< HEAD
socket.on('USER_POSITION_CHANGE', user => {
  console.log('USER_POSITION_CHANGE', JSON.stringify(user))
})

socket.on('USER_APPLY_DAMAGE', user => {
  console.log('USER_APPLY_DAMAGE', JSON.stringify(user))
})

socket.on('USER_STAMINA_CHANGE', user => {
	console.log('USER_STAMINA_CHANGE', JSON.stringify(user))
})

=======
>>>>>>> 7d807ca7b00b2d3cf0afed09bdcfea4b5782235a
function userMove(direction) {
  socket.emit('USER_MOVE_' + direction)
}

function userAttack() {
  socket.emit('USER_ATTACK')
}

<<<<<<< HEAD



=======
socket.onevent = function (packet) {
  console.log(packet.data[0], packet.data[1])
}
>>>>>>> 7d807ca7b00b2d3cf0afed09bdcfea4b5782235a
