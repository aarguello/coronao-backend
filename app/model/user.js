const Actor = require('./actor-new')
const Map = require('./map')
const utils = require('../utils')

class User extends Actor {

  constructor(name, race, class_, defaults) {

    super(name)

    this.type = 'USER'
    this.name = name
    this.race = race
    this.class = class_
    this.equipement = []
    this.spells = Object.keys(global.spells)

    this.stats = this.#buildStats(defaults, race, class_)

    this.physicalDamage = defaults.physicalDamage
    this.inventorySize = defaults.inventorySize
    this.attackEffort = defaults.attackEffort
    this.intervals = { ...defaults.intervals }
  }

  get hp() { return this.stats.hp.current }
  get mana() { return this.stats.mana.current }
  get stamina() { return this.stats.stamina.current }

  move(direction, clientPredictionIndex) {

    const newPosition = super.move(direction)

    if (newPosition) {
      this.#stopMeditating()
      this.emit('POSITION_CHANGED', newPosition, clientPredictionIndex)
    }
  }

  attack() {

    if (this.meditating || this.stamina < this.attackEffort) {
      return
    }

    const neighbour = Map.neighbour(this.position, this.direction)
    const target = global.map.getActor(neighbour)

    if (target) {
      super.attack(target)
    }

    this.decreaseStat('stamina', this.attackEffort)
  }

  kill() {
    super.kill()
    this.decreaseStat('mana', this.mana)
    this.decreaseStat('stamina', this.stamina)
    this.#makeVisible()
    this.#stopMeditating()
    this.equipement = []
    this.reviveTimeout = setTimeout(() => this.revive(), this.intervals.revive)
  }

  meditate() {
    if (this.meditating) {
      this.#stopMeditating()
    } else if (this.hp > 0 && this.mana < this.stats.mana.max) {
      this.#startMeditating()
    }
  }

  revive() {

    if (this.hp > 0) {
      return
    }

    clearTimeout(this.reviveTimeout)
    delete this.reviveTimeout

    this.increaseStat('hp', this.stats.hp.max)
    this.increaseStat('mana', this.stats.mana.max)
    this.increaseStat('stamina', this.stats.stamina.max)

    this.emit('REVIVED')
  }

  makeInvisible(duration) {

    if (this.invisible || this.hp === 0) {
      return
    }

    this.invisible = true
    this.invisibilityTimeout = setTimeout(() => this.#makeVisible(), duration)
    this.emit('VISIBILITY_CHANGED', true)
  }

  #makeVisible() {
    clearTimeout(this.invisibilityTimeout)
    delete this.invisibilityTimeout
    this.invisible = false
    this.emit('VISIBILITY_CHANGED', false)
  }

  useItem(item) {

    if (this.hp === 0 || !this.inventory[item._id]) {
      return
    }

    if (item.consumable) {
      this.#consumeItem(item)
    } else {
      if (this.equipement.includes(item)) {
        this.#unequipItem(item)
      } else {
        this.#equipItem(item)
      }
    }
  }

  removeFromInventory(itemId, amount) {

    super.removeFromInventory(itemId, amount)

    if (!this.inventory[itemId]) {
      this.#unequipItem(itemId)
    }
  }

  getPhysicalDamage() {
    const itemsDamage = utils.getEquipementBonus(this.equipement, 'physicalDamage')
    return (this.physicalDamage + itemsDamage) * this.class.physicalDamage
  }

  getPhysicalDefense() {
    const itemsDefense = utils.getEquipementBonus(this.equipement, 'physicalDefense')
    return itemsDefense * this.class.getPhysicalDefense
  }

  getMagicalDamage() {
    const itemsDamage = utils.getEquipementBonus(this.equipement, 'magicalDamage')
    return itemsDamage * this.class.magicalDamage
  }

  getMagicalDefense() {
    return utils.getEquipementBonus(this.equipement, 'magicalDefense')
  }

  #consumeItem(item) {

    if (item.consumable === 'hp') {
      this.increaseStat('hp', item.value)
    }

    if (item.consumable === 'mana') {
      this.increaseStat('mana', this.stats.mana.max * item.value)
    }

    this.removeFromInventory(item._id, 1)
  }

  #equipItem(item) {

    const itemInSameBodyPart = this.equipement.find(e => e.bodyPart === item.bodyPart)

    if (itemInSameBodyPart) {
      this.#unequipItem(itemInSameBodyPart)
    }

    this.equipement.push(item)
  }

  #unequipItem(item) {
    const index = this.equipement.indexOf(item)
    this.equipement.splice(index, 1)
  }

  #startMeditating() {
    this.meditating = true
    this.meditateInterval = setInterval(this.#meditation.bind(this), this.intervals.meditate)
    this.emit('STARTED_MEDITATING')
  }

  #stopMeditating() {
    clearInterval(this.meditateInterval)
    delete this.meditateInterval
    this.meditating = false
    this.emit('STOPPED_MEDITATING')
  }

  #meditation() {

    this.increaseStat('mana', this.stats.mana.max * 0.05)

    if (this.mana === this.stats.mana.max) {
      this.#stopMeditating()
    }
  }

  #buildStats(base, race, class_) {

    const hp = base.hp * race.hp * class_.hp
    const mana = base.mana * race.mana * class_.mana
    const stamina = base.stamina * race.stamina * class_.stamina

    return {
      hp: { current: hp, max: hp },
      mana: { current: mana, max: mana },
      stamina: { current: stamina, max: stamina },
    }
  }

  affectedBy() {
    return true
  }
}

module.exports = User