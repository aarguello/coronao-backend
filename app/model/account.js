const bcrypt = require('bcrypt')
const store = require('../store')

class Account {

  static exists(username) {
    return store.accounts.findOne({ username })
  }

  static async get(username, password) {

    const account = await store.accounts.findOne({ username })

    if (!account) {
      return
    }

    const match = await bcrypt.compare(password, account.password)

    if (match) {
      return account
    }
  }

  static async create(username, password) {

    password = await bcrypt.hash(password, 10)
    const account = await store.accounts.insertOne({ username, password })

    return new Account(account.insertedId)
  }

  constructor(_id) {
    this._id = _id
  }
}

module.exports = Account