
const username = (username) => {
  const regex = /^(?=.{3,10}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/
  return username && typeof username === 'string' && regex.test(username)
}

const password = (password) => {
  const regex = /^(?=.{5,12}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/
  return password && typeof password === 'string' && regex.test(password)
}

module.exports = { username, password }