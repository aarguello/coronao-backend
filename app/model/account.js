const mongodb = require('mongodb')
const bcryptjs = require('bcryptjs')
const store = require('../store')

class Account {

  static getByUsername(username) {
    return store.accounts.findOne({ username })
  }

  static async getById(_id) {

    const accountId = mongodb.ObjectId(_id)
    const account = await store.accounts.findOne(accountId)

    return new Account(account._id, account.username, account.gameRoomId)
  }

  static async getByCredentials(username, password) {

    const account = await store.accounts.findOne({ username })

    if (!account) {
      return
    }

    const match = await bcryptjs.compare(password, account.password)

    if (match) {
      return new Account(account._id, account.username, account.gameRoomId)
    }
  }

  static async create(username, password) {

    password = await bcryptjs.hash(password, 10)
    const account = await store.accounts.insertOne({ username, password })

    return new Account(account.insertedId, username)
  }

  static remove(_id) {
    store.accounts.deleteOne({ _id: mongodb.ObjectId(_id) })
  }

  constructor(_id, username, gameRoomId) {
    this._id = _id
    this.username = username
    this.gameRoomId = gameRoomId
  }

  setRoom(roomId) {

    this.gameRoomId = roomId

    store.accounts.updateOne(
      { _id: mongodb.ObjectId(this._id) },
      { $set: { gameRoomId: roomId },
    })
  }

  unsetRoom() {

    delete this.gameRoomId

    store.accounts.updateOne(
      { _id: mongodb.ObjectId(this._id) },
      { $unset: { gameRoomId: '' },
    })
  }

}

module.exports = Account