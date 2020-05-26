const Player = require('./player')
const Actor = require('./actor')
const Map = require('./map')

jest.mock('./map')
jest.useFakeTimers()

describe('Player', () => {

  beforeAll(() => {

    global.spells  = { 'some spell id': {} }
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
          "use": 125,
          "revive": 5000
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
      expect(user.equipment).toEqual([])
      expect(user.spells).toEqual(['some spell id'])
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

    it('should start resting', () => {

      // Act
      const user = createTestUser()
      user.stats.stamina.current = 0

      // Assert
      jest.advanceTimersByTime(2999)
      expect(user.stamina).toBe(0)
      jest.advanceTimersByTime(1)
      expect(user.stamina).toBe(75)
    })
  })

  describe('move', () => {

    it('should move actor', () => {

      // Arrange
      const user = createTestUser()
      Actor.prototype.move = jest.fn(() => [1, 0])

      // Act
      user.move('RIGHT', 'randomIndex')

      // Assert
      expect(Actor.prototype.move).toHaveBeenCalledWith('RIGHT')
      expect(user.emit).toHaveBeenCalledWith('POSITION_CHANGED', [1, 0], 'randomIndex')
    })

    it('should stop meditating if position changed', () => {

      // Arrange
      const user = createTestUser()
      Actor.prototype.move = jest.fn(() => [1, 0])
      user.meditating = true

      // Act
      user.move('DOWN')

      // Assert
      expect(user.meditating).toBe(false)
    })

    it('should emit event if position didn\'t change', () => {

      // Arrange
      const user = createTestUser()
      user.position = [1, 0]
      Actor.prototype.move = jest.fn()

      // Act
      user.move('DOWN', 'randomIndex')

      // Assert
      expect(user.emit).toHaveBeenCalledWith('POSITION_CHANGED', [1, 0], 'randomIndex')
    })

    it('should not stop meditating if position didn\'t change', () => {

      // Arrange
      const user = createTestUser()
      Actor.prototype.move = jest.fn()
      user.meditating = true

      // Act
      user.move('DOWN')

      // Assert
      expect(user.meditating).toBe(true)
    })
  })

  describe('attack', () => {

    beforeEach(() => {
      Actor.prototype.attack = jest.fn()
    })

    it('should attack target', () => {

      // Arrange
      const user = createTestUser()
      const target = createTestUser()

      // Act
      user.attack(target)

      // Assert
      expect(Actor.prototype.attack).toHaveBeenCalledWith(target)
    })

    it('should consume stamina', () => {

      // Arrange
      const user = createTestUser()
      const target = createTestUser()

      // Act
      user.attack(target)

      // Assert
      expect(user.stamina).toBe(175)
    })

    it('should not attack with insufficient stamina', () => {

      // Arrange
      const user = createTestUser()
      const target = createTestUser()
      user.stats.stamina.current = 19

      // Act
      user.attack(target)

      // Assert
      expect(Actor.prototype.attack).not.toHaveBeenCalled()
      expect(user.stamina).toBe(19)
    })

    it('should not attack while meditating', () => {

      // Arrange
      const user = createTestUser()
      const target = createTestUser()
      user.meditating = true

      // Act
      user.attack(target)

      // Assert
      expect(Actor.prototype.attack).not.toHaveBeenCalled()
      expect(user.stamina).toBe(250)
    })

    it('should not attack null target', () => {

      // Arrange
      const user = createTestUser()

      // Act
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

    it('should remove equipment', () => {

      // Arrange
      const user = createTestUser()
      user.equipment = ['some sword id']

      // Act
      user.kill()

      // Assert
      expect(user.equipment).toEqual([])
    })

    it('should revive user after five reconds', () => {

      // Arrange
      const user = createTestUser()

      // Act
      user.kill()

      // Assert
      jest.advanceTimersByTime(5000)
      expect(user.hp).toEqual(user.stats.hp.max)
    })
  })

  describe('meditate', () => {

    it('should meditate until mana is full', () => {

      // Arrange
      const user = createTestUser()
      user.stats.mana.current = 450

      // Act
      user.meditate()

      // Assert
      expect(user.meditating).toBe(true)
      expect(user.emit).toHaveBeenCalledWith('STARTED_MEDITATING')
      jest.advanceTimersByTime(100)
      expect(user.meditating).toBe(true)
      jest.advanceTimersByTime(100)
      expect(user.meditating).toBe(false)
    })

    it('should not meditate if dead', () => {

      // Arrange
      const user = createTestUser()
      user.hurt(user.hp)

      // Act
      user.meditate()

      // Assert
      expect(user.meditating).toBeFalsy()
      expect(user.emit).not.toHaveBeenCalledWith('STARTED_MEDITATING')
    })

    it('should not meditate if mana is full', () => {

      // Arrange
      const user = createTestUser()

      // Act
      user.meditate()

      // Assert
      expect(user.meditating).toBeFalsy()
      expect(user.emit).not.toHaveBeenCalledWith('STARTED_MEDITATING')
    })

    it('should stop meditating if user was meditating', () => {

      // Arrange
      const user = createTestUser()
      user.stats.mana.current = 200

      // Act
      user.meditate()
      user.meditate()

      // Assert
      expect(user.meditating).toBe(false)
      expect(user.emit).toHaveBeenCalledWith('STOPPED_MEDITATING')
    })
  })

  describe('revive', () => {

    it('should revive dead user', () => {

      // Arrange
      const user = createTestUser()
      user.stats.hp.current = 0

      // Act
      user.revive()

      // Assert
      expect(user.hp).toBeGreaterThan(0)
      expect(user.emit).toHaveBeenCalledWith('REVIVED')
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

      // Act
      user.revive()

      // Assert
      expect(user.hp).toBe(25)
      expect(user.mana).toBe(15)
      expect(user.stamina).toBe(10)
      expect(user.emit).not.toHaveBeenCalled()
    })

    it('should cancel pending revive', () => {

      // Arrange (triggers a 'revive' in 5 seconds)
      const user = createTestUser()
      user.kill()
      jest.advanceTimersByTime(4000)

      // Act (cancels previous trigger)
      user.revive()
      user.kill()
      jest.advanceTimersByTime(1000)

      // Assert
      expect(user.hp).toBe(0)
    })
  })

  describe('makeInvisible', () => {

    it('should make user invisible', () => {

      // Arrange
      const user = createTestUser()

      // Act
      user.makeInvisible()

      // Assert
      expect(user.invisible).toBe(true)
      expect(user.emit).toHaveBeenCalledWith('VISIBILITY_CHANGED', true)
    })

    it('should remain invisible for defined duration', () => {

      // Arrange
      const user = createTestUser()

      // Act
      user.makeInvisible(100)

      // Assert
      jest.advanceTimersByTime(50)
      expect(user.invisible).toBe(true)
      jest.advanceTimersByTime(50)
      expect(user.invisible).toBe(false)
      expect(user.emit).toHaveBeenCalledWith('VISIBILITY_CHANGED', false)
    })

    it('should not affect dead user', () => {

      // Arrange
      const user = createTestUser()
      user.stats.hp.current = 0

      // Act
      user.makeInvisible()

      // Assert
      expect(user.invisible).toBeFalsy()
      expect(user.emit).not.toHaveBeenCalled()
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
        jest.spyOn(user, 'emit')

        // Act
        user.useItem(helmet)

        // Assert
        expect(user.equipment).toEqual([])
        expect(user.emit).not.toHaveBeenCalled()
      })

      it('should not equip item if it\'s not in inventory', () => {

        // Arrange
        const user = createTestUser()
        const helmet  = { 'some helmet id': 1}
        jest.spyOn(user, 'emit')

        // Act
        user.useItem(helmet)

        // Assert
        expect(user.equipment).toEqual([])
        expect(user.emit).not.toHaveBeenCalled()
      })

      it('should equip item if it\'s not equiped', () => {

        // Arrange
        const user = createTestUser()
        const helmet  = { 'some helmet id': 1}
        user.inventory = { [helmet._id]: 1 }
        jest.spyOn(user, 'emit')

        // Act
        user.useItem(helmet)

        // Assert
        expect(user.equipment).toEqual([helmet])
        expect(user.emit).toHaveBeenCalledWith('EQUIPED_ITEM', helmet._id)
      })

      it('should unequip item if it\'s already equiped', () => {

        // Arrange
        const user = createTestUser()
        const item = { _id: 'some item id', bodyPart: 'HEAD' }
        user.inventory = { [item._id]: 1 }
        user.equipment = [ item ]
        jest.spyOn(user, 'emit')

        // Act
        user.useItem(item)

        // Assert
        expect(user.equipment).toEqual([])
        expect(user.emit).toHaveBeenCalledWith('UNEQUIPED_ITEM', item._id)
      })

      it('should unequip item in same body part before equipping', () => {

        // Arrange
        const user = createTestUser()
        const armor = { _id: 'some armor id', bodyPart: 'TORSO' }
        const sword = { _id: 'some sword id', bodyPart: 'RIGHT_HAND' }
        const hammer = { _id: 'some hammer id', bodyPart: 'RIGHT_HAND' }
        user.inventory = { [armor._id]: 1, [sword._id] : 1, [hammer._id]: 1 }
        user.equipment = [ armor, sword ]
        jest.spyOn(user, 'emit')

        // Act
        user.useItem(hammer)

        // Assert
        expect(user.equipment).toContain(hammer)
        expect(user.equipment).not.toContain(sword)
        expect(user.equipment).toContain(armor)
        expect(user.emit).toHaveBeenCalledWith('UNEQUIPED_ITEM', sword._id)
        expect(user.emit).toHaveBeenCalledWith('EQUIPED_ITEM', hammer._id)
      })

      it('should not modify inventory', () => {

        // Arrange
        const user = createTestUser()
        const sword = { _id: 'some sword id', bodyPart: 'RIGHT_HAND' }
        const hammer = { _id: 'some hammer id', bodyPart: 'RIGHT_HAND' }
        user.inventory = { [sword._id] : 1, [hammer._id]: 1 }
        user.equipment = [ sword ]

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

  describe('decreaseInventoryItem', () => {

    it('should remove item from inventory', () => {

      // Arrange
      const user = createTestUser()
      user.inventory = { 'some item id': 5 }

      // Act
      user.decreaseInventoryItem('some item id', 3)

      // Assert
      expect(user.inventory['some item id']).toEqual(2)
    })

    it('should remove item from equipment if equipped', () =>{

      // Arrange
      const user = createTestUser()
      const armor = { _id: 'some armor id', bodyPart: 'TORSO' }
      const sword = { _id: 'some sword id', bodyPart: 'RIGHT_HAND' }
      user.inventory = { [armor._id]: 14, [sword._id]: 5 }
      user.equipment = [ armor, sword ]

      // Act
      user.decreaseInventoryItem(armor._id, 20)

      // Assert
      expect(user.equipment).toEqual([ sword ])
    })
  })
})

function createTestUser(name) {

  const user = new Player(
    name,
    global.races[0],
    global.classes[0],
    global.config.user
  )

  jest.spyOn(user, 'emit')

  return user
}