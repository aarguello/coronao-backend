const GameRoom = require('./game-room')

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

  describe('startGame', () => {

  })

  describe('addPlayer', () => {

  })

  describe('removePlayer', () => {

  })
})