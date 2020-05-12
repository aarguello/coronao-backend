
let socket

function login() {

  const username = document.getElementById('username').value
  const password = document.getElementById('password').value

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  .then((response) => response.json())
  .then((data) => connect(data.token))
  .catch(console.error)
}

function connect(token) {

  socket = io(`localhost:3000?token=${token}`)

  socket.on('connect', () => {
    document.getElementById('socket_id').innerHTML = socket.id
  })

  socket.on('disconnect', () => {
    document.getElementById('socket_id').innerHTML = ''
  })

  const onevent = socket.onevent

  socket.onevent = function (packet) {
    console.log(packet.data)
    onevent.call(this, packet)
  }
}

function userMove(direction) {
  socket.emit('USER_MOVE', direction)
}

function userAttack() {
  socket.emit('USER_ATTACK')
}