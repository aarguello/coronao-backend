const Map      = require('./map')
const utils    = require('./utils')
const emitters = require('./emitters')

class User {

  constructor(_id, name) {

    const userClass = utils.getRandomClass()
    const userRace  = utils.getRandomRace()

    const HP      = userClass.hp + userRace.hp
    const MANA    = userClass.mana + userRace.mana
    const STAMINA = userClass.stamina

    this._id         = _id
    this.name        = name
    this.class       = userClass.name
    this.race        = userRace.name
    this.direction   = 'DOWN'
    this.inventory   = {}
    this.equipement  = []
    this.spells      = Object.keys(global.spells)

    this.stats = {
      hp:      { current: HP,      max: HP },
      mana:    { current: MANA,    max: MANA },
      stamina: { current: STAMINA, max: STAMINA },
    }

    setInterval(this.rest.bind(this), global.intervals.staminaRecover)
  }

  /* Getters */

  get hp() {
    return this.stats.hp.current
  }

  get mana() {
    return this.stats.mana.current
  }

  get stamina() {
    return this.stats.stamina.current
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

    this.decreaseStat('hp', Math.round(damage))

    if (this.hp === 0) {
      this.#kill(this)
    }
  }

  revive() {

    if (this.hp > 0) {
      return
    }

    this.#setStat('hp', this.max_HP * 0.2)
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
    if (this.stats[stat]) {
      return this.#setStat(stat, this[stat] + value)
    }
  }

  decreaseStat(stat, value) {
    if (this.stats[stat]) {
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
    return utils.getEquipementBonus(this.equipement, 'physical_defense')
  }

  getMagicalDamage() {
    const classDamage = global.classes[this.class].magical_damage
    const itemsDamage = utils.getEquipementBonus(this.equipement, 'magical_damage') / 100 + 1
    return classDamage * itemsDamage
  }

  getMagicalDefense() {
    return utils.getEquipementBonus(this.equipement, 'magical_defense')
  }

  /* Private */

  #setStat(stat, value) {

    const min = 0
    const max = this.stats[stat].max

    if (value < min) {
      value = min
    } else if (value > max) {
      value = max
    }

    if (this[stat] != value) {
      this.stats[stat].current = value
      emitters.userStatChanged(this._id, stat, this.stats[stat])
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
    this.#setStat('hp', 0)
    this.#setStat('stamina', 0)
    this.equipement = []
    this.unfreeze()
    emitters.userDied(this._id)
  }
}

module.exports = User