const Actor = require('./actor-new')
const Map = require('./map')

jest.mock('./map')

describe('Actor', () => {

  beforeEach(() => {
    global.map = new Map('some map id')
    Map.mockClear()
  })

  describe('constructor', () => {

    it('should set _id', () => {
      const actor = new Actor('some random id')
      expect(actor._id).toBe('some random id')
    })

    it('should initialize HP', () => {
      const actor = new Actor('some random id')
      expect(actor.hp).toBe(0)
      expect(actor.stats.hp.max).toBe(0)
    })
  })

  describe('move', () => {

    it('should set actor\'s direction', () => {

      // Arrange
      const actor = new Actor('some actor id')

      // Act
      actor.move('RIGHT')

      // Assert
      expect(actor.direction).toBe('RIGHT')
    })

    it('should move actor when position is free', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.position = [0, 0]
      Map.neighbour = jest.fn(() => [1, 0])

      // Act
      actor.move('RIGHT')

      // Assert
      expect(actor.position).toEqual([1, 0])
      expect(global.map.moveActor).toHaveBeenCalledWith(actor, [0, 0], [1, 0])
    })

    it('should not move actor when position collides', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.position = [0, 0]
      global.map.collides = jest.fn(() => true)

      // Act
      actor.move('RIGHT')

      // Assert
      expect(actor.position).toEqual([0, 0])
      expect(global.map.moveActor).not.toHaveBeenCalled()
    })

    it('should not move actor when frozen', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.position = [0, 0]
      actor.frozen = true

      // Act
      actor.move('RIGHT')

      // Assert
      expect(actor.position).toEqual([0, 0])
      expect(global.map.moveActor).not.toHaveBeenCalled()
    })
  })

  describe('increase stat', () => {

    it('should not accept negative values', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.increaseStat('hp', -15)

      // Assert
      expect(actor.hp).toBe(50)
    })

    it('shoud increase stat when value is positive', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.increaseStat('hp', 15)

      // Assert
      expect(actor.hp).toBe(65)
    })

    it('should not increase over maximum', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.increaseStat('hp', 85)

      // Assert
      expect(actor.hp).toBe(100)
    })
  })

  describe('decrease stat', () => {

    it('should not accept negative values', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.decreaseStat('hp', -15)

      // Assert
      expect(actor.hp).toBe(50)
    })

    it('should descrease stat when value is positive', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.decreaseStat('hp', 15)

      // Assert
      expect(actor.hp).toBe(35)
    })

    it('should not decrease below zero', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.decreaseStat('hp', 85)

      // Assert
      expect(actor.hp).toBe(0)
    })
  })
})