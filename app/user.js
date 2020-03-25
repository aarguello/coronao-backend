const Map      = require('./map')
const utils    = require('./utils')
const emitters = require('./emitters')

class User {

  #stats = ['HP', 'mana', 'stamina']

  constructor(_id, name) {

    const userClass = utils.getRandomClass()
    const userRace  = utils.getRandomRace()

    this._id         = _id
    this.name        = name
    this.class       = userClass.name
    this.race        = userRace.name
    this.max_HP      = userClass.HP + userRace.HP
    this.max_mana    = userClass.mana + userRace.mana
    this.max_stamina = userClass.stamina
    this.HP          = this.max_HP
    this.mana        = this.max_mana
    this.stamina     = this.max_stamina
    this.direction   = 'DOWN'
    this.inventory   = {}
    this.equipement  = []
    this.spells      = Object.keys(global.spells)

    setInterval(this.rest.bind(this), global.intervals.staminaRecover)
  }

  /* Public  */

  move(direction) {

    const allowedDirections = ['LEFT', 'RIGHT', 'UP', 'DOWN']

    if (!allowedDirections.includes(direction)) {
      return
    }

    const position = Map.getNeighbourPosition(this.position, direction)

    Map.pivotActor('USER', this._id, direction, emitters.userDirectionChanged)
    Map.moveActor('USER', this._id, position, emitters.userPositionChanged)
  }

  speak(message) {

    if (message.length > global.messageMaxLength) {
      message = message.slice(0, global.messageMaxLength) + '...'
    }

    emitters.userSpoke(this._id, message)
  }

  rest() {

    const covered = this.equipement.find(itemId =>
      global.items[itemId].body_part === 'TORSO'
    )

    if (covered) {
      this.increaseStat('stamina', 15)
    }
  }

  suffer(damage) {

    this.decreaseStat('HP', damage)

    if (this.HP === 0) {
      this.#kill(this)
    }
  }

  revive() {

    if (this.HP > 0) {
      return
    }

    this.#setStat('HP', this.max_HP * 0.2)
    this.#setStat('mana', this.max_mana * 0.2)
    this.#setStat('stamina', this.max_stamina * 0.2)

    emitters.userRevived(this._id)
  }

  freeze() {
    this.frozen = true
    this.frozenTimeout = setTimeout(() => this.frozen = false, global.intervals.frozen)
  }

  unfreeze() {
    this.frozen = false
    clearTimeout(this.frozenTimeout)
    delete this.frozenTimeout
  }

  increaseStat(stat, value) {
    if (this.#stats.includes(stat)) {
      return this.#setStat(stat, this[stat] + value)
    }
  }

  decreaseStat(stat, value) {
    if (this.#stats.includes(stat)) {
      return this.#setStat(stat, this[stat] - value)
    }
  }

  toggleItem(itemId) {

    const item = global.items[itemId]

    if (!item || !this.inventory[itemId]) {
      return
    }

    if (this.equipement.includes(itemId)) {
      this.#unequipItem(item)
    } else {
      this.#equipItem(item)
    }
  }

  getPhysicalDamage() {
    const classDamage = global.classes[this.class].physical_damage
    const itemsDamage = utils.getEquipementBonus(this.equipement, 'physical_damage')
    return global.baseDamage * classDamage + itemsDamage
  }

  getPhysicalDefense() {
    return items.getEquipementBonus(this, 'physical_defense')
  }

  getMagicalDamage() {
    const classDamage = global.classes[this.class].magical_damage
    const itemsDamage = utils.getEquipementBonus(this.equipement, 'magical_damage') / 100 + 1
    return classDamage * itemsDamage
  }

  getMagicalDefense() {
    return items.getEquipementBonus(this, 'magical_defense')
  }

  /* Private */

  #setStat(stat, value) {

    const min = 0
    const max = this['max_' + stat]

    if (value < min) {
      value = min
    } else if (value > max) {
      value = max
    }

    if (this[stat] != value) {
      this[stat] = value
      emitters.userStatChanged(stat, value)
    }
  }

  #equipItem(item) {

    const itemInSameBodyPart = this.equipement.find(itemId =>
      global.items[itemId].body_part === item.body_part
    )

    if (itemInSameBodyPart) {
      this.#unequipItem(itemInSameBodyPart)
    }

    this.equipement.push(item._id)
    emitters.userEquipedItem(this._id, item._id)
  }

  #unequipItem(item) {
    this.equipement = this.equipement.filter(itemId => itemId !== item._id)
    emitters.userUnequipedItem(this._id, item._id)
  }

  #kill() {
    this.HP = 0
    this.stamina = 0
    this.equipement = []
    this.unfreeze()
    emitters.userDied(this._id)
  }
}

module.exports = User