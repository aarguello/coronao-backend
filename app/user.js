const Actor        = require('./model/actor')
const Map          = require('./map')
const utils        = require('./utils')
const EventEmitter = require('events')

class User extends Actor {

  #events = new EventEmitter()

  #staminaInterval

  constructor(name, race, class_) {

    super(name)

    const HP      = class_.hp + race.hp
    const MANA    = class_.mana + race.mana
    const STAMINA = class_.stamina

    this.type        = 'USER'
    this.name        = name
    this.class       = class_.name
    this.race        = race.name
    this.inventory   = {}
    this.equipement  = []
    this.spells      = Object.keys(global.spells)

    this.stats = {
      hp:      { current: HP,      max: HP },
      mana:    { current: MANA,    max: MANA },
      stamina: { current: STAMINA, max: STAMINA },
    }

    this.#staminaInterval = setInterval(this.rest.bind(this), global.intervals.userRecoverStamina)
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

    if (this.meditating) {
      this.#stopMeditating()
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

  attack() {

    if (this.hp === 0 || this.meditating || this.stamina < global.blowEffort) {
      return
    }

    let damage    =  0
    let neighbour = Map.getNeighbourPosition(this.position, this.direction)
    let target    = Map.getActorInTile(neighbour)

    if (target && target.hp > 0) {
      damage = super.attack(target)
    }

    this.#events.emit('ATTACKED', damage)
    this.decreaseStat('stamina', global.blowEffort)
  }

  meditate() {
    if (this.meditating) {
      this.#stopMeditating()
    } else if (this.mana < this.stats.mana.max) {
      this.#startMeditating()
    }
  }

  toggleItem(itemId) {

    const item = global.items[itemId]

    if (!item || !this.inventory[itemId]) {
      return
    }

    if (item.consumable) {
        this.#consumeItem(item)
    } else {
      if (this.equipement.includes(itemId)) {
        this.#unequipItem(item)
      } else {
        this.#equipItem(item)
      }
    }
  }

  rest() {

    // TEMP: disable covered check
    // const covered = this.equipement.find(itemId =>
    //   global.items[itemId].body_part === 'TORSO'
    // )

    if (this.hp > 0) {
      this.increaseStat('stamina', global.staminaIncrement)
    }
  }

  suffer(damage) {
    // TEMP: Until frontend implements meditation, this is the only way to recover mana
    this.increaseStat('mana', damage * 2)
    super.suffer(damage)
  }

  kill() {
    super.kill()
    this.setStat('stamina', 0)
    this.setStat('mana', 0)
    this.#stopMeditating()
    this.#makeVisible()
    this.equipement = []
    this.#events.emit('DIED')

    // TEMP: Until frontend implements revival, this is the only way to recover revive
    setTimeout(() => this.revive(), 5000)
  }

  revive() {

    if (this.hp > 0) {
      return
    }

    this.setStat('hp', this.stats.hp.max * 1)
    this.setStat('mana', this.stats.mana.max * 1)
    this.setStat('stamina', this.stats.stamina.max * 1)

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
    this.meditateInterval = setInterval(this.#meditation.bind(this), global.intervals.userRecoverMana)
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

    this.increaseStat('mana', this.stats.mana.max * global.meditateIncrement)

    if (this.mana === this.stats.mana.max) {
      this.#stopMeditating()
    }
  }

  #consumeItem(item) {

    let value = item.value

    if (item.consumable === 'mana') {
      value *= this.stats['mana'].max / 100
    }

    this.increaseStat(item.consumable, value)
    this.#decreaseInventory(item._id, 1)
  }

  #decreaseInventory(itemId, amount) {

    if (!this.inventory[itemId]) {
      return
    }

    if (this.inventory[itemId] - amount > 0) {
      this.inventory[itemId] -= amount
    } else {
      delete this.inventory[itemId]
    }

    this.#events.emit('INVENTORY_CHANGED', this._id, itemId, this.inventory[itemId] || 0)
  }
}

module.exports = User
