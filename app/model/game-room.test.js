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

    it('should not start game with missing players', () => {

      // Arrange
      const room = new GameRoom('some random id', 1)

      // Act
      room.startGame()

      // Assert
      expect(room.status).toBe('QUEUE')
    })

    it('should start game with full capacity', () => {

      // Arrange
      const room = new GameRoom('some random id', 1)
      room.addPlayer('some player id', {})

      // Act
      room.startGame()

      // Assert
      expect(room.status).toBe('INGAME')
    })

  })

  describe('addPlayer', () => {

    it('should not add player if game started', () => {

      // Arrange
      const room = new GameRoom('some random id', 1)
      room.addPlayer('player 1', {})
      room.startGame()

      // Act
      room.addPlayer('player 2', {})

      // Assert
      expect(Object.keys(room.players)).toEqual(['player 1'])
    })

    it('should add player while in queue', () => {

      // Arrange
      const room = new GameRoom('some random id', 1)

      // Act
      room.addPlayer('some player id', {})

      // Assert
      expect(Object.keys(room.players)).toEqual(['some player id'])
    })

    it('should set player position', () => {

      // Arrange
      const room = new GameRoom('some random id', 1)
      const player = {}

      // Act
      room.addPlayer('some player id', player)

      // Assert
      expect(room.map.randomPosition).toHaveBeenCalled()
      expect(room.map.moveActor).toHaveBeenCalledWith(player, null, player.position)
    })
  })

  describe('removePlayer', () => {

    it('should remove player from room', () => {

      // Arrange
      const room = new GameRoom('some random id', 2)
      room.addPlayer('player 1', {})
      room.addPlayer('player 2', {})

      // Act
      room.removePlayer('player 1')

      // Assert
      expect(Object.keys(room.players)).toEqual(['player 2'])
    })
  })
})