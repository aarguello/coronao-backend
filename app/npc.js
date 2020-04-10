const Actor    = require('./model/actor')
const Map      = require('./model/map')
const utils    = require('./utils')
const PF       = require('pathfinding')
const emitters = require('./emitters')

class Npc extends Actor {

  emitter = new (require('events').EventEmitter);

  constructor(npcClass) {

    const _id = '_' + Math.random().toString(36).substr(2, 9)

    super(_id)

    const hp = { current: npcClass.HP, max: npcClass.HP }
    const isMutated = Math.random() >= 0.9

    this.name           = npcClass.name
    this.type           = 'NPC'
    this.fov            = npcClass.fov
    this.stats          = { hp }
    this._damage        = npcClass.physical_damage
    this.attackSpeed    = npcClass.attack_speed
    this.movementSpeed  = npcClass.movement_speed
    this.mutated        = isMutated
    this.messages       = npcClass.messages

    this.lastMove   = 0
    this.lastAttack = 0

    if (isMutated) {
      this.damage = this._damage.map(x => x*2)
      this.stats.hp.max *= 2
      this.movementSpeed *= 0.8
      this.attackSpeed *= 0.7
    }

  }

  /* Getters */
  get damage() {
    return utils.getRandomInt(...this._damage)
  }

  /* Setters */
  set damage(damage) {
    this._damage = damage
  }

  isCloseToAttack(target) {

    const neighbour = Map.neighbour(this.position, this.direction)
    const actor = global.map.getActor(neighbour)

    if (actor && actor.type === 'USER' && actor._id === target._id) {
      return true
    }

    return false
  }

  attack() {
    if (!this.isHunting()) return
    let isClose = this.isCloseToAttack(this.currentTarget)
    if (isClose) {
      this.speak('attack')
      super.attack(this.currentTarget)
      this.lastAttack = Date.now()
    }
  }

  getPhysicalDamage() {
    return this.damage
  }

  move(direction) {

    const newPosition = super.move(direction)

    if (newPosition) {
      emitters.npcPositionChanged(this._id, newPosition)
      this.lastMove = Date.now()
    }
  }

  getOrLookForPrey() {
    this.currentTarget = global.map.getNearestUser(this.position, this.fov)
    return this.currentTarget
  }

  followPrey() {
    const prey = this.getOrLookForPrey()
    if (prey) {
      this.follow(prey)
    }
  }

  wander() {
    this.speak('wander')
    switch(utils.getRandomInt(0, 10)) {
      case 0:
        this.move('UP')
        break
      case 1:
        this.move('DOWN')
        break
      case 2:
        this.move('LEFT')
        break
      case 3:
        this.move('RIGHT')
        break
      default:
        break
    }
  }

  follow(target){

    let grid = new PF.Grid(global.map.size, global.map.size)
    let finder = new PF.AStarFinder()

    const collisions = global.map.collisions()

    collisions.forEach(position => {
      if (!Map.equals(position, target.position)) {
        grid.setWalkableAt(...position, false)
      }
    })

    let path = finder.findPath(this.position[0], this.position[1], target.position[0], target.position[1], grid)

    // if it's not 1 position away
    if (path.length > 1) {
      //advance just 1 next tile
      let direction
      if (path[0][0] - path[1][0] == -1)  direction = 'RIGHT'
      if (path[0][0] - path[1][0] == 1)   direction = 'LEFT'
      if (path[0][1] - path[1][1] == -1)  direction = 'DOWN'
      if (path[0][1] - path[1][1] == 1)   direction = 'UP'
      this.move(direction)
      this.speak('follow')
    }
  }

  speak(functionName) {
    if (Math.random() >= 0.9) {
      let possibleMessages = this.messages[functionName]
      if (possibleMessages.length < 1) return
      const messageIndex = utils.getRandomInt(0, possibleMessages.length)
      emitters.npcSpeak(this._id, possibleMessages[messageIndex])
    }
  }

  getEvasion() {
    return 0
  }

  getPhysicalDefense() {
    return 0
  }

  getMagicalDefense() {
    return 0
  }

  affectedBy(spell) {
    return ['DAMAGE', 'FREEZE', 'UNFREEZE'].includes(spell.type)
  }

  isHunting(){
    if (this.currentTarget && this.currentTarget.hp > 0) return true
    return false
  }

  performActions() {
    const currentTime = Date.now()
    const prey = this.getOrLookForPrey()

    if (prey) {
      if (currentTime - this.lastAttack >= this.attackSpeed && currentTime - this.lastMove >= this.movementSpeed) {
        this.attack()
      }
      if (currentTime - this.lastMove >= this.movementSpeed) {
        this.followPrey()
      }
    } else {
      if (currentTime - this.lastMove >= this.movementSpeed) {
        this.wander()
      }
    }
  }

}

function makeNPCsPerformActions () {
  Object.entries(global.aliveNPCs).forEach(([_, npc]) => {
    npc.performActions()
  })
}

function spawnNPC() {

  const npc = new Npc(utils.getRandomNPC())
  const position = global.map.randomPosition()

  global.aliveNPCs[npc._id] = npc
  global.map.moveActor(npc, null, position)

  npc.position = position
  npc.events.on('DIRECTION_CHANGED', emitters.npcDirectionChanged)
  npc.events.on('STAT_CHANGED', emitters.npcStatChanged)
  npc.events.on('DIED', () => haveFuneral(npc))

  emitters.npcSpawned(npc)
}

function haveFuneral(npc) {
  emitters.npcDied(npc._id)
  global.map.removeActor(npc.position)
  delete global.aliveNPCs[npc._id]
  spawnNPC()
}

module.exports.init = () => {

  amount = utils.getRandomInt(...global.mapNPCs.amount)

  for (i = 0; i < amount; i++) {
    spawnNPC()
  }

  setInterval(makeNPCsPerformActions, global.intervals.npcActions)
}
