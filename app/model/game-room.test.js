const GameRoom = require('./game-room')
const utils = require('../utils')

jest.mock('./map')

describe('gameRoom', () => {

  describe('constructor', () => {

    it('should set _id and capacity', () => {

      // Arrange
      const room = new GameRoom('some random id', 5)

      // Assert
      expect(room._id).toBe('some random id')
      expect(room.capacity).toBe(5)
    })

    it('should load map', () => {

    })
  })

  describe('addSocket', () => {

    it('should map accountId to socket', () => {

    })

  })

  describe('addPlayer', () => {

    it('should add player to game room', () => {

      // Arrange
      const room = new GameRoom('some random id', 1)

      // Act
      room.addPlayer('player 1', createTestPlayer())

      // Assert
      expect(Object.keys(room.players)).toEqual(['player 1'])
    })

    it('should not add player on full capacity', () => {

      // Arrange
      const room = new GameRoom('some random id', 1)

      // Act
      room.addPlayer('player 1', createTestPlayer())
      room.addPlayer('player 2', createTestPlayer())

      // Assert
      expect(Object.keys(room.players)).toEqual(['player 1'])
    })

    it('should set player position', () => {

      // Arrange
      const room = new GameRoom('some random id', 1)
      const player = createTestPlayer()

      // Act
      room.addPlayer('some player id', player)

      // Assert
      expect(room.map.randomPosition).toHaveBeenCalled()
      expect(room.map.moveActor).toHaveBeenCalledWith(player, null, player.position)
    })

    it('should set player inventory by class', () => {

      // Arrange
      const room = new GameRoom('some random id', 1)
      const player = createTestPlayer()
      utils.getInventory = jest.fn()
      utils.getInventory.mockReturnValueOnce('some bard inventory')

      // Act
      room.addPlayer('some player id', player)

      // Assert
      expect(utils.getInventory).toHaveBeenCalledWith('BARD')
      expect(player.inventory).toEqual('some bard inventory')
    })
  })

  describe('removePlayer', () => {

    it('should remove player from room', () => {

      // Arrange
      const room = new GameRoom('some random id', 2)
      room.addPlayer('player 1', createTestPlayer())
      room.addPlayer('player 2', createTestPlayer())

      // Act
      room.removePlayer('player 1')

      // Assert
      expect(Object.keys(room.players)).toEqual(['player 2'])
    })
  })

  it('should remove socket from room', () => {

  })
})

function createTestPlayer(name) {
  return { name, class: { name: 'BARD' } }
}