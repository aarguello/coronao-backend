const broadcast = require('../emitters')

module.exports.init = function init(roomId, map) {

  map.events.on('TILE_ITEM_CHANGED', (...args) => {
    broadcast.tileItemChanged(roomId, ...args)
  })

}