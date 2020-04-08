const Actor = require('./actor-new')
const Map = require('./map')

class User extends Actor {

  constructor(name, race, class_, defaults) {

    super(name)

    this.type = 'USER'
    this.name = name
    this.race = race
    this.class = class_

    this.stats = this.#buildStats(defaults, race, class_)

    this.physicalDamage = defaults.physicalDamage
    this.inventorySize = defaults.inventorySize
    this.attackEffort = defaults.attackEffort
    this.intervals = { ...defaults.intervals }
  }

  get hp() { return this.stats.hp.current }
  get mana() { return this.stats.mana.current }
  get stamina() { return this.stats.stamina.current }

  move(direction) {
    this.meditating = false
    super.move(direction)
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

  meditate() {
    if (this.meditating) {
      this.#stopMeditating()
    } else if (this.hp > 0 && this.mana < this.stats.mana.max) {
      this.#startMeditating()
    }
  }

  #startMeditating() {
    this.meditating = true
    this.meditateInterval = setInterval(this.#meditation.bind(this), this.intervals.meditate)
  }

  #stopMeditating() {
    clearInterval(this.meditateInterval)
    delete this.meditateInterval
    this.meditating = false
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
}

module.exports = User