
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

  socket.on('USER_POSITION_CHANGED', updatePosition)
  socket.on('USER_WELCOME', updatePosition)

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

function updatePosition(data) {

  data = data.user ? data.user : data

  if (data._id === payload.name) {
    const x = data.position[0]
    const y = data.position[1]
    document.getElementById('user_position').innerHTML = `(${x}, ${y})`
  }
}