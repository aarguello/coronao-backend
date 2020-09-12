const broadcast = require('../emitters')

module.exports.init = function init(roomId, npc) {

  broadcast.npcSpawned(roomId, npc)

  npc.events.on('DIRECTION_CHANGED', (_, direction) => {
    broadcast.npcDirectionChanged(roomId, npc._id, direction)
  })

  npc.events.on('POSITION_CHANGED', (_, position) => {
    broadcast.npcPositionChanged(roomId, npc._id, position)
  })

}