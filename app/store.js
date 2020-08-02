
const MongoClient = require('mongodb').MongoClient

class Store {

  #client
  #connected

  constructor(uri) {
    const config = { useNewUrlParser: true, useUnifiedTopology: true }
    this.#client = new MongoClient(uri, config)
  }

  init() {
    return this.#client.connect().then(() => this.#connected = true)
  }

  get db () {
    return this.#connected && this.#client.db()
  }

  get accounts () {
    return this.#client.db().collection('accounts')
  }
}

module.exports = new Store(process.env.DB_URI)