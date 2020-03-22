let socket = io()

socket.on('connect', () => {
  document.getElementById('socket_id').innerHTML = socket.id
})

socket.on('USER_POSITION_CHANGE', user => {
  console.log('USER_POSITION_CHANGE', JSON.stringify(user))
})

socket.on('USER_APPLY_DAMAGE', user => {
  console.log('USER_APPLY_DAMAGE', JSON.stringify(user))
})

socket.on('USER_JOINED', user => {
  console.log('USER_JOINED', JSON.stringify(user))
})

function userMove(direction) {
  socket.emit('USER_MOVE_' + direction)
}

function userAttack() {
  socket.emit('USER_ATTACK')
}