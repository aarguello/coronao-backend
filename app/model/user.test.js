const User = require('./user')
const Actor = require('./actor-new')
const Map = require('./map')

jest.mock('./map')
jest.useFakeTimers()

describe('User', () => {

  beforeAll(() => {

    global.races   = [ { name: 'HUMAN', hp: 2, mana: 1,   stamina: 0.5 } ]
    global.classes = [ { name: 'MAGE',  hp: 2, mana: 0.5, stamina: 1   } ]

    global.config = {
      user: {
        "hp": 400,
        "mana": 1000,
        "stamina": 500,
        "physicalDamage": 50,
        "attackEffort": 75,
        "inventorySize": 25,
        "intervals": {
          "move": 200,
          "speak": 500,
          "attack": 500,
          "cast": 500,
          "meditate": 100,
          "rest": 3000,
          "use": 125
        }
      }
    }

    global.map = new Map('some map name')
  })

  describe('constructor', () => {

    it('should set initial values', () => {

      // Act
      const user = createTestUser('Legolas')

      // Assert
      expect(user._id).toBe('Legolas')
      expect(user.name).toBe('Legolas')
      expect(user.type).toBe('USER')
      expect(user.race).toBe(global.races[0])
      expect(user.class).toBe(global.classes[0])
      expect(user.equipement).toEqual([])
    })

    it('should set stats based on defaults, race and class', () => {

      // Act
      const user = createTestUser()

      // Assert
      expect(user.hp).toBe(1600)
      expect(user.mana).toBe(500)
      expect(user.stamina).toBe(250)
      expect(user.stats.hp.max).toBe(1600)
      expect(user.stats.mana.max).toBe(500)
      expect(user.stats.stamina.max).toBe(250)
    })

    it('should copy intervals from defaults', () => {

      // Act
      const user = createTestUser()

      // Assert
      expect(user.intervals).toEqual(global.config.user.intervals)
      expect(user.intervals).not.toBe(global.config.user.intervals)
    })

    it('should set base damage, attack effort and inventory size', () => {

      // Act
      const user = createTestUser()

      // Assert
      expect(user.physicalDamage).toBe(50)
      expect(user.attackEffort).toBe(75)
      expect(user.inventorySize).toBe(25)
    })
  })

  describe('move', () => {

    it('should move actor', () => {

      // Arrange
      const user = createTestUser()
      Actor.prototype.move = jest.fn()

      // Act
      user.move('RIGHT')

      // Assert
      expect(Actor.prototype.move).toHaveBeenCalledWith('RIGHT')
    })

    it('should stop meditating', () => {

      // Arrange
      const user = createTestUser()
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
      user = createTestUser()
      user.position = [0, 0]
      user.direction = 'RIGHT'

      target = createTestUser()
      target.position = [1, 0]
      target.direction = 'DOWN'

      Actor.prototype.attack = jest.fn()
      Map.neighbour = jest.fn(() => [1, 0])
      global.map.getActor = jest.fn(() => target)
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
      expect(user.stamina).toBe(175)
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
      expect(user.stamina).toBe(175)
    })
  })

  describe('kill', () => {

    it('should set stats to zero', () => {

      // Arrange
      const user = createTestUser()

      // Act
      user.kill()

      // Assert
      expect(user.hp).toBe(0)
      expect(user.mana).toBe(0)
      expect(user.stamina).toBe(0)
    })

    it('should make user visible', () => {

      // Arrange
      const user = createTestUser()
      user.invisible = true

      // Act
      user.kill()

      // Assert
      expect(user.invisible).toBe(false)
    })

    it('should stop meditating', () => {

      // Arrange
      const user = createTestUser()
      user.meditating = true

      // Act
      user.kill()

      // Assert
      expect(user.meditating).toBe(false)
    })

    it('should remove equipement', () => {

      // Arrange
      const user = createTestUser()
      user.equipement = ['some sword id']

      // Act
      user.kill()

      // Assert
      expect(user.equipement).toEqual([])
    })
  })

  describe('meditate', () => {

    it('should meditate until mana is full', () => {

      // Arrange
      const user = createTestUser()
      user.stats.mana.current = 450
      jest.spyOn(user.events, 'emit')

      // Act
      user.meditate()

      // Assert
      expect(user.meditating).toBe(true)
      expect(user.events.emit).toHaveBeenCalledWith('STARTED_MEDITATING')
      jest.advanceTimersByTime(100)
      expect(user.meditating).toBe(true)
      jest.advanceTimersByTime(100)
      expect(user.meditating).toBe(false)
    })

    it('should not meditate if dead', () => {

      // Arrange
      const user = createTestUser()
      user.hurt(user.hp)
      jest.spyOn(user.events, 'emit')

      // Act
      user.meditate()

      // Assert
      expect(user.meditating).toBeFalsy()
      expect(user.events.emit).not.toHaveBeenCalled()
    })

    it('should not meditate if mana is full', () => {

      // Arrange
      const user = createTestUser()
      jest.spyOn(user.events, 'emit')

      // Act
      user.meditate()

      // Assert
      expect(user.meditating).toBeFalsy()
      expect(user.events.emit).not.toHaveBeenCalled()
    })

    it('should stop meditating if user was meditating', () => {

      // Arrange
      const user = createTestUser()
      user.stats.mana.current = 200
      jest.spyOn(user.events, 'emit')

      // Act
      user.meditate()
      user.meditate()

      // Assert
      expect(user.meditating).toBe(false)
      expect(user.events.emit).toHaveBeenCalledWith('STOPPED_MEDITATING')
    })
  })

  describe('revive', () => {

    it('should revive dead user', () => {

      // Arrange
      const user = createTestUser()
      user.stats.hp.current = 0
      jest.spyOn(user.events, 'emit')

      // Act
      user.revive()

      // Assert
      expect(user.hp).toBeGreaterThan(0)
      expect(user.events.emit).toHaveBeenCalledWith('REVIVED')
    })

    it('should restore stats to their max value', () => {

      // Arrange
      const user = createTestUser()
      user.stats = {
        hp: { current: 0, max: 100 },
        mana: { current: 70, max: 200 },
        stamina: { current: 0, max: 150 },
      }

      // Act
      user.revive()

      // Assert
      expect(user.hp).toBe(100)
      expect(user.mana).toBe(200)
      expect(user.stamina).toBe(150)
    })

    it('should not revive living user', () => {

      // Arrange
      const user = createTestUser()
      user.stats.hp.current = 25
      user.stats.mana.current = 15
      user.stats.stamina.current = 10
      jest.spyOn(user.events, 'emit')

      // Act
      user.revive()

      // Assert
      expect(user.hp).toBe(25)
      expect(user.mana).toBe(15)
      expect(user.stamina).toBe(10)
      expect(user.events.emit).not.toHaveBeenCalled()
    })
  })

  describe('makeInvisible', () => {

    it('should make user invisible', () => {

      // Arrange
      const user = createTestUser()
      jest.spyOn(user.events, 'emit')

      // Act
      user.makeInvisible()

      // Assert
      expect(user.invisible).toBe(true)
      expect(user.events.emit).toHaveBeenCalledWith('VISIBILITY_CHANGED', true)
    })

    it('should remain invisible for defined duration', () => {

      // Arrange
      const user = createTestUser()
      jest.spyOn(user.events, 'emit')

      // Act
      user.makeInvisible(100)

      // Assert
      jest.advanceTimersByTime(50)
      expect(user.invisible).toBe(true)
      jest.advanceTimersByTime(50)
      expect(user.invisible).toBe(false)
      expect(user.events.emit).toHaveBeenCalledWith('VISIBILITY_CHANGED', false)
    })

    it('should not affect dead user', () => {

      // Arrange
      const user = createTestUser()
      user.stats.hp.current = 0
      jest.spyOn(user.events, 'emit')

      // Act
      user.makeInvisible()

      // Assert
      expect(user.invisible).toBeFalsy()
      expect(user.events.emit).not.toHaveBeenCalled()
    })

    it('should not affect invisible user', () => {

      // Arrange
      const user = createTestUser()

      // Act
      user.makeInvisible(100) // Valid call
      jest.advanceTimersByTime(50)
      user.makeInvisible(100) // This one should do nothing
      jest.advanceTimersByTime(50)
      user.makeInvisible(100) // Valid call

      // Assert
      jest.advanceTimersByTime(50)
      expect(user.invisible).toBe(true)
    })
  })

  describe('useItem', () => {

    describe('equipables', () => {

      it('should not equip items when dead', () => {

        // Arrange
        const user = createTestUser()
        const helmet  = { 'some helmet id': 1}
        user.stats.hp.current = 0
        user.inventory = { [helmet._id]: 1 }

        // Act
        user.useItem(helmet)

        // Assert
        expect(user.equipement).toEqual([])
      })

      it('should not equip item if it\'s not in inventory', () => {

        // Arrange
        const user = createTestUser()
        const helmet  = { 'some helmet id': 1}

        // Act
        user.useItem(helmet)

        // Assert
        expect(user.equipement).toEqual([])
      })

      it('should equip item if it\'s not equiped', () => {

        // Arrange
        const user = createTestUser()
        const helmet  = { 'some helmet id': 1}
        user.inventory = { [helmet._id]: 1 }

        // Act
        user.useItem(helmet)

        // Assert
        expect(user.equipement).toEqual([helmet])
      })

      it('should unequip item if it\'s already equiped', () => {

        // Arrange
        const user = createTestUser()
        const item = { _id: 'some item id', bodyPart: 'HEAD' }
        user.inventory = { [item._id]: 1 }
        user.equipement = [ item ]

        // Act
        user.useItem(item)

        // Assert
        expect(user.equipement).toEqual([])
      })

      it('should unequip item in same body part before equipping', () => {

        // Arrange
        const user = createTestUser()
        const armor = { _id: 'some armor id', bodyPart: 'TORSO' }
        const sword = { _id: 'some sword id', bodyPart: 'RIGHT_HAND' }
        const hammer = { _id: 'some hammer id', bodyPart: 'RIGHT_HAND' }
        user.inventory = { [armor._id]: 1, [sword._id] : 1, [hammer._id]: 1 }
        user.equipement = [ armor, sword ]

        // Act
        user.useItem(hammer)

        // Assert
        expect(user.equipement).toContain(hammer)
        expect(user.equipement).not.toContain(sword)
        expect(user.equipement).toContain(armor)
      })

      it('should not modify inventory', () => {

        // Arrange
        const user = createTestUser()
        const sword = { _id: 'some sword id', bodyPart: 'RIGHT_HAND' }
        const hammer = { _id: 'some hammer id', bodyPart: 'RIGHT_HAND' }
        user.inventory = { [sword._id] : 1, [hammer._id]: 1 }
        user.equipement = [ sword ]

        // Act
        user.useItem(hammer)

        // Assert
        expect(user.inventory[sword._id]).toBe(1)
        expect(user.inventory[hammer._id]).toBe(1)
      })
    })

    describe('consumables', () => {

      it('should not consume items when dead', () => {

        // Arrange
        const user = createTestUser()
        const potion = { _id: 'some potion id', consumable: 'hp' }
        user.inventory = { [potion._id]: 5 }
        user.stats.hp.current = 0

        // Act
        user.useItem(potion)

        // Assert
        expect(user.inventory[potion._id]).toBe(5)
      })

      it('should sustract one from item\'s quantity in inventory', () => {

        // Arrange
        const user = createTestUser()
        const potion = { _id: 'some potion id', consumable: 'hp' }
        user.inventory = { [potion._id]: 5 }

        // Act
        user.useItem(potion)

        // Assert
        expect(user.inventory[potion._id]).toBe(4)
      })

      it('should remove item from inventory if it was the last one', () => {

        // Arrange
        const user = createTestUser()
        const potion = { _id: 'some potion id', consumable: 'hp' }
        user.inventory = { [potion._id]: 1 }

        // Act
        user.useItem(potion)

        // Assert
        expect(user.inventory[potion._id]).toBeUndefined()
      })

      describe('hp', () => {
        it('should increase stat by fixed value', () => {

          // Arrange
          const user = createTestUser()
          const healthPotion = { _id: 'some health potion id', consumable: 'hp', value: 5 }
          user.inventory = { [healthPotion._id]: 1 }
          user.stats.hp.current = 5

          // Act
          user.useItem(healthPotion)

          // Assert
          expect(user.hp).toBe(10)
        })
      })

      describe('mana', () => {
        it('should increase stat by perentage of maximum value', () => {

          // Arrange
          const user = createTestUser()
          const manaPotion = { _id: 'some mana potion id', consumable: 'mana', value: 0.1 }
          user.inventory = { [manaPotion._id]: 1 }
          user.stats.mana.current = 0

          // Act
          user.useItem(manaPotion)

          // Assert
          expect(user.mana).toBe(50)
        })
      })
    })
  })

  describe('removeFromInventory', () => {

    it('should remove item from inventory', () => {

      // Arrange
      const user = createTestUser()
      user.inventory = { 'some item id': 5 }

      // Act
      user.removeFromInventory('some item id', 3)

      // Assert
      expect(user.inventory['some item id']).toEqual(2)
    })

    it('should remove item from equipement when removing from inventory', () =>{

      // Arrange
      const user = createTestUser()
      user.inventory = { 'some item id': 14, 'another item id': 5 }
      user.equipement = ['some item id', 'another item id']

      // Act
      user.removeFromInventory('some item id', 20)

      // Assert
      expect(user.equipement).toEqual(['another item id'])
    })
  })
})

function createTestUser(name) {
  return new User(name, global.races[0], global.classes[0], global.config.user)
}