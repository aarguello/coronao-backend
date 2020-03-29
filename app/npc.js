const Actor    = require('./model/actor')
const Map      = require('./map')
const utils    = require('./utils')
const PF       = require('pathfinding')
const user     = require('./user')
const emitters = require('./emitters')

class Npc extends Actor {

  emitter = new (require('events').EventEmitter);

  constructor(npcClass) {

    const _id = '_' + Math.random().toString(36).substr(2, 9)

    super(_id)

    const hp = { current: npcClass.HP, max: npcClass.HP }
    const isMutated = Math.random() >= 0.8

    this.name        = npcClass.name
    this.type        = 'NPC'
    this.position    = Map.getRandomPosition()
    this.fov         = npcClass.fov
    this.stats       = { hp }
    this._damage      = npcClass.physical_damage
    this.attackSpeed = npcClass.attack_speed
    this.mutated     = isMutated

    if (isMutated) {
      this.damage = this._damage.map(x => x**2)
      this.stats.hp.max *= 2
    }

    setInterval(this.attack.bind(this), this.attackSpeed)
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
    const neighbour = Map.getNeighbourPosition(this.position, this.direction)
    if (target == Map.getActorInTile(neighbour)) {
      return true
    }

    return false
  }

  attack() {
    if (!this.currentTarget) return
    let isClose = this.isCloseToAttack(this.currentTarget)
    if (isClose) {
      super.attack(this.currentTarget)
    }
  }

  getPhysicalDamage() {
    return this.damage
  }

  move(direction) {

    if (!Map.directions.includes(direction)) {
      return
    }

    const [ moved, pivoted ] = super.move(direction)

    if (pivoted) {
      emitters.npcDirectionChanged(this._id, this.direction)
    }

    if (moved) {
      emitters.npcPositionChanged(this._id, this.position)
    }
  }

  freeze() {
    this.frozen = true
    this.frozenTimeout = setTimeout(() => this.frozen = false, global.intervals.frozen)
  }

  followClosest() {
    const closestUser = Map.getNearestUser(this.position, this.fov)
    if (closestUser) {
      this.currentTarget = closestUser
      this.follow(closestUser)
    } else {
      this.currentTarget = null
    }
  }

  follow(target){

    let grid = new PF.Grid(global.map.size, global.map.size)
    let finder = new PF.AStarFinder()

    Object.keys(global.map.positions).forEach((positionStr) => {
      const position = positionStr.split(',').map(Number)
      if (Map.checkCollision(position) && !utils.arraysMatch(target.position, position)) grid.setWalkableAt(...position, false)
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
    }
  }

  setStat(stat, value) {

    const valueChanged = super.setStat(stat, value)

    if (valueChanged) {
      emitters.npcStatChanged(this._id, stat, this.stats[stat])
    }
  }

  kill() {
    super.kill()
    this.emitter.emit('DIED')
    emitters.npcDied(this._id)
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
}

function makeNPCsFollowUsers () {
  Object.entries(global.aliveNPCs).forEach(([_, npc]) => {
    npc.followClosest()
  })
}

function spawnNPC() {

  const npc = new Npc(utils.getRandomNPC())

  global.aliveNPCs[npc._id] = npc
  Map.updateActorPosition(npc, Map.getRandomPosition())

  npc.emitter.on('DIED', () => haveFuneral(npc))

  emitters.npcSpawned(npc)
}

function haveFuneral(npc) {
  delete global.map.positions[npc.position].NPC
  delete global.aliveNPCs[npc._id]
  spawnNPC()
}

module.exports.init = () => {

  amount = utils.getRandomInt(...global.mapNPCs.amount)

  for (i = 0; i < amount; i++) {
    spawnNPC()
  }

  setInterval(makeNPCsFollowUsers, global.intervals.pathfinder)
}
