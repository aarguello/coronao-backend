const Actor = require('./actor')
const Map = require('./map')
const utils = require('../utils')

class User extends Actor {

  constructor(name, race, class_, defaults) {

    super(name)

    this.type = 'USER'
    this.name = name
    this.race = race
    this.class = class_
    this.spells = Object.keys(global.spells)
    this.equipment = [
      global.items['jXnfxBE01Hx3YsTTi734'],
      global.items['8Z5Fzc9t3VAQotaaZEag'],
    ]

    this.stats = this.#buildStats(defaults, race, class_)

    this.physicalDamage = defaults.physicalDamage
    this.inventorySize = defaults.inventorySize
    this.attackEffort = defaults.attackEffort
    this.intervals = { ...defaults.intervals }

    // Rest
    setInterval(() => {
      if (this.hp > 0) {
        this.increaseStat('stamina', this.attackEffort)
      }
    }, this.intervals.rest)
  }

  get hp() { return this.stats.hp.current }
  get mana() { return this.stats.mana.current }
  get stamina() { return this.stats.stamina.current }

  move(direction, clientPredictionIndex) {

    const position = super.move(direction)

    if (!position) {
      return
    }

    if (this.meditating) {
      this.#stopMeditating()
    }

    this.emit('POSITION_CHANGED', position, clientPredictionIndex)
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
    this.equipment = []
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
      if (this.equipment.includes(item)) {
        this.#unequipItem(item._id)
      } else {
        this.#equipItem(item)
      }
    }
  }

  decreaseInventoryItem(itemId, amount) {

    super.decreaseInventoryItem(itemId, amount)

    if (!this.inventory[itemId]) {
      this.#unequipItem(itemId)
    }
  }

  getPhysicalDamage() {
    const itemsDamage = utils.getequipmentBonus(this.equipment, 'physicalDamage')
    const classDamage = this.class.physicalDamage || 1
    return (this.physicalDamage + itemsDamage) * classDamage
  }

  getPhysicalDefense() {
    const itemsDefense = utils.getequipmentBonus(this.equipment, 'physicalDefense')
    const classDefense = this.class.physicalDefense || 1
    return itemsDefense * classDefense
  }

  getMagicalDamage() {
    const itemsDamage = utils.getequipmentBonus(this.equipment, 'magicalDamage') || 1
    const classDamage = this.class.magicalDamage || 1
    return itemsDamage * classDamage
  }

  getMagicalDefense() {
    return utils.getequipmentBonus(this.equipment, 'magicalDefense')
  }

  #consumeItem(item) {

    if (item.consumable === 'hp') {
      this.increaseStat('hp', item.value)
    }

    if (item.consumable === 'mana') {
      this.increaseStat('mana', this.stats.mana.max * item.value)
    }

    this.decreaseInventoryItem(item._id, 1)
  }

  #equipItem(item) {

    const itemInSameBodyPart = this.equipment.find(e => e.bodyPart === item.bodyPart)

    if (itemInSameBodyPart) {
      this.#unequipItem(itemInSameBodyPart._id)
    }

    this.equipment.push(item)
    this.emit('EQUIPED_ITEM', item._id)
  }

  #unequipItem(itemId) {

    const index = this.equipment.findIndex(item => item._id === itemId)

    if (index !== -1) {
      this.equipment.splice(index, 1)
      this.emit('UNEQUIPED_ITEM', itemId)
    }
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