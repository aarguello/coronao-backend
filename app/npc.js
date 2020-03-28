const Actor    = require('./model/actor')
const Map      = require('./map')
const utils    = require('./utils')
const PF       = require('pathfinding')
const user     = require('./user')
const emitters = require('./emitters')

class Npc extends Actor {

  constructor(npcClass) {

    const _id = '_' + Math.random().toString(36).substr(2, 9)

    super(_id)

    const isMutated = Math.random() >= 0.8

    this.name      = npcClass.name
    this.type      = 'NPC'
    this.position  = Map.getRandomPosition()
    this.fov       = npcClass.fov
    this.max_HP    = npcClass.HP
    this.damage    = npcClass.physical_damage
    this.mutated   = isMutated

    if (isMutated) {
      this.damage = this.damage.map(function(x){return x**2})
      this.max_HP *= 2
    }

    this.HP = this.max_HP

  }

  move(direction) {
    if (!Map.directions.includes(direction)) {
      return
    }

    const moved = super.move(direction)

    if (this.direction !== direction) {
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
    if (!this.currentTarget || this.currentTarget.hp === 0) {
      const closestUser = Map.getNearestUser(this.position, this.fov)
      if (closestUser) {
        this.currentTarget = closestUser
      }
    }
    if (this.currentTarget) this.follow(this.currentTarget)
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
    if (path.length > 2) {
      //advance just 1 next tile
      let direction
      if (path[0][0] - path[1][0] == -1)  direction = 'RIGHT'
      if (path[0][0] - path[1][0] == 1)   direction = 'LEFT'
      if (path[0][1] - path[1][1] == -1)  direction = 'DOWN'
      if (path[0][1] - path[1][1] == 1)   direction = 'UP'
      this.move(direction)
    }
  }
}

function makeNPCsFollowUsers () {
  Object.entries(global.aliveNPCs).forEach(([_, npc]) => {
    npc.followClosest()
  })
}

function spawnRandomNPCs(amount) {
  for (i = 0; i < amount; i++) {
    const npc = new Npc(utils.getRandomNPC())

    global.aliveNPCs[npc._id] = npc
    Map.updateActorPosition(user, Map.getRandomPosition())

    emitters.npcSpawned(npc)
  }
}

module.exports.init = () => {
  spawnRandomNPCs(3)
  setInterval(makeNPCsFollowUsers, global.intervals.pathfinder)
}
