
let socket
let token = localStorage.getItem('jwt');
let payload = { name: 'Nitsu' }

if (!token) {

  fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then((response) => response.json())
    .then((data) => connect(data.token))
    .catch(console.error)

} else {
  connect(token)
}

function connect(token) {

  socket = io(`localhost:3000?token=${token}`)

  socket.on('connect', () => {
    localStorage.setItem('jwt', token);
    document.getElementById('socket_id').innerHTML = socket.id
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