const Actor = require('./actor-new')
const Map = require('./map')

jest.mock('./map')
jest.useFakeTimers()

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

  describe('hurt', () => {

    it('should inflict positive damage', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.hurt(25)

      // Assert
      expect(actor.hp).toBe(25)
    })

    it('should not inflict negative damage', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.hurt(-25)

      // Assert
      expect(actor.hp).toBe(50)
    })

    it('should unfreeze actor when killed', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }
      actor.unfreeze = jest.fn()

      // Act
      actor.hurt(9999)

      // Assert
      expect(actor.hp).toBe(0)
      expect(actor.unfreeze).toHaveBeenCalled()
    })
  })

  describe('freeze', () => {

    it('should freeze actor', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.frozen = false

      // Act
      actor.freeze()

      // Assert
      expect(actor.frozen).toBe(true)
    })

    it('should stay frozen for elapsed duration', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.frozen = false

      // Act
      actor.freeze(1000)

      // Assert
      jest.advanceTimersByTime(500)
      expect(actor.frozen).toBe(true)
      jest.advanceTimersByTime(500)
      expect(actor.frozen).toBe(false)
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