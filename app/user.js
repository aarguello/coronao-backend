const Actor        = require('./model/actor')
const Map          = require('./map')
const utils        = require('./utils')
const EventEmitter = require('events')

class User extends Actor {

  #events = new EventEmitter()

  constructor(_id, name) {

    super(_id)

    const userClass = utils.getRandomClass()
    const userRace  = utils.getRandomRace()

    const HP      = userClass.hp + userRace.hp
    const MANA    = userClass.mana + userRace.mana
    const STAMINA = userClass.stamina

    this.name        = name
    this.type        = 'USER'
    this.class       = userClass.name
    this.race        = userRace.name
    this.inventory   = { 'XD0VuskON97LFPG0kdct': 1 }
    this.equipement  = ['XD0VuskON97LFPG0kdct']
    this.spells      = Object.keys(global.spells)

    this.stats = {
      hp:      { current: HP,      max: HP },
      mana:    { current: MANA,    max: MANA },
      stamina: { current: STAMINA, max: STAMINA },
    }

    setInterval(this.rest.bind(this), global.intervals.staminaRecover)
  }

  /* Getters */

  get mana() {
    return this.stats.mana.current
  }

  get stamina() {
    return this.stats.stamina.current
  }

  /* Public  */

  on(action, handler) {
    this.#events.on(action, handler.bind(null, this._id))
  }

  move(direction) {

    if (!Map.directions.includes(direction) || this.meditating) {
      return
    }

    const [ moved, pivoted ] = super.move(direction)

    if (pivoted) {
      this.#events.emit('DIRECTION_CHANGED', this.direction)
    }

    if (moved) {
      this.#events.emit('POSITION_CHANGED', this.position)
    }
  }

  speak(message) {

    if (message.length > global.messageMaxLength) {
      message = message.slice(0, global.messageMaxLength) + '...'
    }

    this.#events.emit('SPOKE', message)
  }

  meditate() {
    if (this.meditating) {
      this.#stopMeditating()
    } else if (this.mana < this.stats.mana.max) {
      this.#startMeditating()
    }
  }

  rest() {

    const covered = this.equipement.find(itemId =>
      global.items[itemId].body_part === 'TORSO'
    )

    if (covered) {
      this.increaseStat('stamina', global.staminaIncrement)
    }
  }

  kill() {
    super.kill()
    this.setStat('stamina', 0)
    this.#stopMeditating()
    this.#makeVisible()
    this.equipement = []
    this.#events.emit('DIED')
  }

  revive() {

    if (this.hp > 0) {
      return
    }

    this.setStat('hp', this.stats.hp.max * 0.2)
    this.setStat('mana', this.stats.mana.max * 0.2)
    this.setStat('stamina', this.stats.stamina.max * 0.2)

    this.#events.emit('REVIVED')
  }

  makeInvisible(duration) {

    clearTimeout(this.invisibilityTimeout)

    if (!this.invisible) {
      this.invisible = true
      this.#events.emit('VISIBILITY_CHANGED', true)
    }

    if (duration) {
      this.invisibilityTimeout = setTimeout(this.#makeVisible.bind(this), duration)
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

  getEvasion() {
    return global.classes[this.class].evasion - 1
  }

  affectedBy(spell) {
    return true
  }

  /* Private */

  setStat(stat, value) {

    const valueChanged = super.setStat(stat, value)

    if (valueChanged) {
      this.#events.emit('STAT_CHANGED', stat, this.stats[stat])
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
    this.#events.emit('EQUIPED_ITEM', item._id)
  }

  #unequipItem(item) {
    this.equipement = this.equipement.filter(itemId => itemId !== item._id)
    this.#events.emit('UNEQUIPED_ITEM', item._id)
  }

  #makeVisible() {

    clearTimeout(this.invisibilityTimeout)
    delete this.invisibilityTimeout

    if (this.invisible) {
      this.invisible = false
      this.#events.emit('VISIBILITY_CHANGED', false)
    }
  }

  #startMeditating() {
    this.meditating = true
    this.meditateInterval = setInterval(this.#meditation.bind(this), global.intervals.meditate)
    this.#events.emit('STARTED_MEDITATING')
  }

  #stopMeditating() {

    clearInterval(this.meditateInterval)
    delete this.meditateInterval

    if (this.meditating) {
      this.meditating = false
      this.#events.emit('STOPPED_MEDITATING')
    }
  }

  #meditation() {

    this.increaseStat('mana', this.mana * global.meditateIncrement)

    if (this.mana === this.stats.mana.max) {
      this.#stopMeditating()
    }
  }
}

module.exports = User
