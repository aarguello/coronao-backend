const Map      = require('./map')
const utils    = require('./utils')
const PF       = require('pathfinding')
const user     = require('./user')
const emitters = require('./emitters')

module.exports.init = () => {
  spawnRandomNPCs(3)
  setInterval(makeNPCsFollowUsers, global.intervals.pathfinder)
}

function spawnRandomNPCs(amount) {
  console.log('Creating ', amount,' NPCs...')
  for (i = 0; i < amount; i++) {
    create()
  }
}

function create() {

  const npcClass = utils.getRandomNPC()
  const isMutated = Math.random() >= 0.8

  const npc = {
    _id: '_' + Math.random().toString(36).substr(2, 9),
    name: npcClass.name,
    position: Map.getRandomPosition(),
    fov: npcClass.fov,
    direction: 'DOWN',
    max_HP: npcClass.HP,
    damage: npcClass.physical_damage,
    mutated: isMutated,
  }

  if (isMutated) {
    npc.damage = npc.damage.map(function(x){return x**2})
    npc.max_HP *= 2
  }

  npc.HP = npc.max_HP

  global.aliveNPCs[npc._id] = npc
  Map.moveActor('NPC', npc._id, npc.position)

  npc.reposition = function (direction, position) {
    if (!this.frozen) {
      Map.pivotActor('NPC', this._id, direction, emitters.npcDirectionChanged)
      Map.moveActor('NPC', this._id, position, emitters.npcPositionChanged)
    }
  }

  npc.freeze = function () {
    this.frozen = true
    this.frozenTimeout = setTimeout(() => this.frozen = false, global.intervals.frozen)
  }

  npc.followClosest = function () {
    closestId = Map.getNearestNeighbourAtSight(this.position, this.fov, "USER")
    if (closestId) {
      this.follow(global.users[closestId])
    }
  }

  npc.follow = function (target){
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
      this.reposition(direction, path[1])
    }
  }
}

function makeNPCsFollowUsers () {
  Object.entries(global.aliveNPCs).forEach(([_, npc]) => {
    npc.followClosest()
  })
}

