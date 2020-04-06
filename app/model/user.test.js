const User = require('./user')
const Actor = require('./actor-new')
const Map = require('./map')

jest.mock('./map')
jest.useFakeTimers()

describe('User', () => {

  const stats = { hp: 500, mana: 500, stamina: 500 }
  const race = { name: 'HUMAN', hp: 2, mana: 1, stamina: 0.5 }
  const class_ = { name: 'MAGE', hp: 2, mana: 0.5, stamina: 1 }

  beforeAll(() => {
    global.map = new Map('some map name')
  })

  describe('constructor', () => {

    it('should set type, _id, name, race and class', () => {

      // Act
      const user = new User('Legolas', stats, race, class_)

      // Assert
      expect(user.type).toBe('USER')
      expect(user._id).toBe('Legolas')
      expect(user.name).toBe('Legolas')
      expect(user.race).toBe('HUMAN')
      expect(user.class).toBe('MAGE')
    })

    it('should set stats based on race and class', () => {

      // Act
      const user = new User('Legolas', stats, class_, race)

      // Assert
      expect(user.hp).toBe(2000)
      expect(user.mana).toBe(250)
      expect(user.stamina).toBe(250)
      expect(user.stats.hp.max).toBe(2000)
      expect(user.stats.mana.max).toBe(250)
      expect(user.stats.stamina.max).toBe(250)
    })
  })

  describe('move', () => {

    it('should move actor', () => {

      // Arrange
      const user = new User('Legolas', stats, race, class_)
      Actor.prototype.move = jest.fn()

      // Act
      user.move('RIGHT')

      // Assert
      expect(Actor.prototype.move).toHaveBeenCalledWith('RIGHT')
    })

    it('should stop medidating', () => {

      // Arrange
      const user = new User('Legolas', stats, race, class_)
      user.meditating = true

      // Act
      user.move('DOWN')

      // Assert
      expect(user.meditating).toBe(false)
    })
  })

  describe('attack', () => {

    let user, target

    beforeEach(() => {

      // Arrange
      user = new User('Sherlock', stats, race, class_)
      user.position = [0, 0]
      user.direction = 'RIGHT'

      target = new User('Moriarty', stats, race, class_)
      target.position = [1, 0]
      target.direction = 'DOWN'

      Actor.prototype.attack = jest.fn()
      Map.neighbour = jest.fn(() => [1, 0])
      global.map.getActor = jest.fn(() => target)
      global.blowEffort = 20
    })

    it('should attack neighbour', () => {

      // Act
      user.attack()

      // Assert
      expect(Map.neighbour).toHaveBeenCalledWith([0, 0], 'RIGHT')
      expect(global.map.getActor).toHaveBeenCalledWith([1, 0])
      expect(Actor.prototype.attack).toHaveBeenCalledWith(target)
    })

    it('should consume stamina', () => {

      // Act
      user.attack()

      // Assert
      expect(user.stamina).toBe(230)
    })

    it('should not attack with insufficient stamina', () => {

      // Arrange
      user.stats.stamina.current = 19

      // Act
      user.attack()

      // Assert
      expect(Actor.prototype.attack).not.toHaveBeenCalled()
      expect(user.stamina).toBe(19)
    })

    it('should not attack while meditating', () => {

      // Arrange
      user.meditating = true

      // Act
      user.attack()

      // Assert
      expect(Actor.prototype.attack).not.toHaveBeenCalled()
      expect(user.stamina).toBe(250)
    })

    it('should not attack null target', () => {

      // Act
      global.map.getActor = jest.fn(() => null)
      user.attack()

      // Assert
      expect(Actor.prototype.attack).not.toHaveBeenCalled()
      expect(user.stamina).toBe(230)
    })
  })

  describe('meditate', () => {

    it('should meditate until mana is full', () => {

      // Arrange
      const user = new User('Legolas', stats, race, class_)
      user.stats.mana.current = 0
      global.meditateIncrement = 0.5
      global.intervals = { userRecoverMana: 100 }

      // Act
      user.meditate()

      // Assert
      expect(user.meditating).toBe(true)
      jest.advanceTimersByTime(100)
      expect(user.meditating).toBe(true)
      jest.advanceTimersByTime(100)
      expect(user.meditating).toBe(false)
    })

    it('should not meditate if dead', () => {

      // Arrange
      const user = new User('Legolas', stats, race, class_)
      user.hurt(user.hp)

      // Act
      user.meditate()

      // Assert
      expect(user.meditating).toBeFalsy()
    })

    it('should not meditate if mana is full', () => {

      // Arrange
      const user = new User('Legolas', stats, race, class_)

      // Act
      user.meditate()

      // Assert
      expect(user.meditating).toBeFalsy()
    })

    it('should stop meditating if user was meditating', () => {

      // Arrange
      const user = new User('Legolas', stats, race, class_)
      user.stats.mana.current = 200

      // Act
      user.meditate()
      user.meditate()

      // Assert
      expect(user.meditating).toBe(false)
    })
  })
})