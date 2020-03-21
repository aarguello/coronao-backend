let socket = io()

socket.on('connect', () => {
  document.getElementById('socket_id').innerHTML = socket.id
})

socket.on('USER_POSITION_CHANGE', user => {
  console.log(
    'User',
    user._id,
    'changed position to (',
    user.position.x, user.position.y, ')'
   )
})

function userMove(direction) {
  socket.emit('USER_MOVE_' + direction)
}