const Actor = require('./actor')
const Map = require('./map')

jest.mock('./map')
jest.useFakeTimers()

describe('Actor', () => {

  beforeEach(() => {
    global.config = {}
    global.map = new Map('some map id')
    Map.mockClear()
  })

  describe('constructor', () => {

    it('should set _id', () => {
      const actor = new Actor('some random id')
      expect(actor._id).toBe('some random id')
    })

    it('should start looking down', () => {
      const actor = new Actor('some random id')
      expect(actor.direction).toBe('DOWN')
    })

    it('should initialize HP and inventory', () => {
      const actor = new Actor('some random id')
      expect(actor.hp).toBe(0)
      expect(actor.stats.hp.max).toBe(0)
      expect(actor.inventory).toEqual({})
      expect(actor.inventorySize).toBe(5)
    })
  })

  describe('move', () => {

    it('should set actor\'s direction', () => {

      // Arrange
      const actor = new Actor('some actor id')
      jest.spyOn(actor, 'emit')

      // Act
      actor.move('UP')

      // Assert
      expect(actor.direction).toBe('UP')
      expect(actor.emit).toHaveBeenCalledWith('DIRECTION_CHANGED', 'UP')
    })

    it('should not emit actor\'s direction if it does not change', () => {

      // Arrange
      const actor = new Actor('some random id')
      actor.direction = 'DOWN'
      jest.spyOn(actor, 'emit')

      // Act
      actor.move('DOWN')

      // Assert
      expect(actor.emit).not.toHaveBeenCalled()
    })

    it('should move actor when position is free', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.position = [0, 0]
      Map.neighbour = jest.fn(() => [1, 0])
      jest.spyOn(actor, 'emit')

      // Act
      const position = actor.move('RIGHT')

      // Assert
      expect(global.map.moveActor).toHaveBeenCalledWith(actor, [0, 0], [1, 0])
      expect(actor.position).toEqual([1, 0])
      expect(position).toEqual([1, 0])
    })

    it('should not move actor when position collides', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.position = [0, 0]
      global.map.collides = jest.fn(() => true)
      jest.spyOn(actor, 'emit')

      // Act
      const position = actor.move('DOWN')

      // Assert
      expect(actor.position).toEqual([0, 0])
      expect(global.map.moveActor).not.toHaveBeenCalled()
      expect(position).toBeUndefined()
    })

    it('should not move actor when frozen', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.position = [0, 0]
      actor.frozen = true

      // Act
      actor.move('LEFT')

      // Assert
      expect(actor.position).toEqual([0, 0])
      expect(global.map.moveActor).not.toHaveBeenCalled()
    })
  })

  describe('speak', () => {

    it('should emit "SPOKE" event with message', () => {

      // Arrange
      const actor = new Actor('some actor id')
      jest.spyOn(actor, 'emit')

      // Act
      actor.speak('hey there!')

      // Assert
      expect(actor.emit).toHaveBeenCalledWith('SPOKE', 'hey there!')
    })

    it('should not exceed maximum length', () => {

      // Arrange
      const actor = new Actor('some actor id')
      jest.spyOn(actor, 'emit')
      global.config.messageMaxLength = 3

      // Act
      actor.speak('hey there!')

      // Assert
      expect(actor.emit).toHaveBeenCalledWith('SPOKE', 'hey...')
    })
  })

  describe('attack', () => {

    let user, target

    beforeEach(() => {

      user = new Actor('some actor id')
      user.stats.hp = { current: 100, max: 100 }
      jest.spyOn(user, 'emit')

      target = new Actor('some target id')
      target.stats.hp = { current: 75, max: 100 }
      target.dodge = jest.fn(() => false)
    })

    it('should apply damage based on attack and defense attributes', () => {

      // Arrange
      user.getPhysicalDamage = jest.fn(() => 100)
      target.getPhysicalDefense = jest.fn(() => 50)

      // Act
      user.attack(target)

      // Assert
      expect(target.hp).toBe(25)
      expect(user.emit).toHaveBeenCalledWith('ATTACKED', 50)
    })

    it('should not attack if dead', () => {

      // Arrange
      user.stats.hp.current = 0
      user.getPhysicalDamage = jest.fn(() => 100)
      target.getPhysicalDefense = jest.fn(() => 50)

      // Act
      user.attack(target)

      // Assert
      expect(target.hp).toBe(75)
      expect(user.emit).not.toHaveBeenCalled()
    })

    it('should not apply negative damage', () => {

      // Arrange
      user.getPhysicalDamage = jest.fn(() => 100)
      target.getPhysicalDefense = jest.fn(() => 125)

      // Act
      user.attack(target)

      // Assert
      expect(target.hp).toBe(75)
      expect(user.emit).toHaveBeenCalledWith('ATTACKED', 0)
    })

    it('should not apply damage when target dodges', () => {

      // Arrange
      user.getPhysicalDamage = jest.fn(() => 100)
      target.getPhysicalDefense = jest.fn(() => 50)
      target.dodge = jest.fn(() => true)

      // Act
      user.attack(target)

      // Assert
      expect(target.hp).toBe(75)
      expect(user.emit).toHaveBeenCalledWith('ATTACKED', 0)
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

    it('should kill user when damage exceeds hp', () => {

      // Arrange
      const actor = new Actor('some actor id')
      const kill = jest.spyOn(actor, 'kill')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.hurt(50)

      // Assert
      expect(kill).toHaveBeenCalled()
    })

    it('should drop items when killed', () => {

    })
  })

  describe('kill', () => {

    it('should emit "DIED" event', () => {

      // Arrange
      const actor = new Actor('some actor id')
      jest.spyOn(actor, 'emit')

      // Act
      actor.kill()

      // Assert
      expect(actor.emit).toHaveBeenCalledWith('DIED')
    })

    it('should set hp to zero', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }

      // Act
      actor.kill()

      // Assert
      expect(actor.hp).toBe(0)
    })

    it('should unfreeze actor', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.frozen = true

      // Act
      actor.kill()

      // Assert
      expect(actor.frozen).toBe(false)
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

    it('it should reset frozen duration', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.frozen = false

      // Act
      actor.freeze(500)
      jest.advanceTimersByTime(250)
      actor.freeze(500)

      // Assert
      jest.advanceTimersByTime(250)
      expect(actor.frozen).toBe(true)
      jest.advanceTimersByTime(250)
      expect(actor.frozen).toBe(false)
    })
  })

  describe('unfreeze', () => {

    it('should unfreeze actor', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.frozen = true

      // Act
      actor.unfreeze()

      // Assert
      expect(actor.frozen).toBe(false)
    })
  })

  describe('grabItem', () => {

    beforeAll(() => {
      global.itemStackLimit = 10000
    })

    it('should not grab item when inventory is full', () => {

      // Arrange
      const actor = new Actor()
      actor.inventorySize = 1
      actor.inventory = { 'some item id': 1 }
      global.map.getItem = jest.fn(() => ({ _id: 'another item id', quantity: 1 }))

      // Act
      actor.grabItem()

      // Assert
      expect(actor.inventory).toEqual({ 'some item id': 1 })
    })

    it('should grab item on current position', () => {

      // Arrage
      const actor = new Actor()
      actor.position = [1, 1]
      global.map.getItem = jest.fn(() => ({ _id: 'some item id', quantity: 2 }))

      // Act
      actor.grabItem()

      // Assert
      expect(global.map.getItem).toHaveBeenCalledWith([1, 1])
      expect(actor.inventory).toEqual({ 'some item id': 2 })
    })

    it('should not grab if tile is empty', () => {

      // Arrage
      const actor = new Actor()
      actor.position = [1, 1]
      global.map.getItem = jest.fn()

      // Act
      actor.grabItem()

      // Assert
      expect(actor.inventory).toEqual({})
    })

    it('should increase item quantity in inventory', () => {

      // Arrage
      const actor = new Actor()
      this.inventorySize = 1
      actor.inventory = { 'some item id': 1 }
      global.map.getItem = jest.fn(() => ({ _id: 'some item id', quantity: 6 }))

      // Act
      actor.grabItem()

      // Assert
      expect(actor.inventory).toEqual({ 'some item id': 7 })
    })

    it('should not increase quantity over stacking limit', () => {

      // Arrage
      const actor = new Actor()
      actor.inventory = { 'some item id': 45 }
      global.map.getItem = jest.fn(() => ({ _id: 'some item id', quantity: 9997 }))

      // Act
      actor.grabItem()

      // Assert
      expect(actor.inventory).toEqual({ 'some item id': 10000 })
    })

    it('should sustract item quantity on tile', () => {

      // Arrage
      const actor = new Actor()
      actor.position = [1, 0]
      actor.inventory = { 'some item id': 7000 }
      global.map.getItem = jest.fn(() => ({ _id: 'some item id', quantity: 8000 }))

      // Act
      actor.grabItem()

      // Assert
      expect(map.removeItem).toHaveBeenCalledWith([1, 0], 3000)
    })
  })

  describe('dropItem', () => {

    beforeAll(() => {
      global.itemStackLimit = 10000
    })

    it('should drop item on current position', () => {

      // Arrange
      const actor = new Actor()
      actor.position = [0, 1]
      actor.inventory = { 'some item id': 5 }

      // Act
      actor.dropItem('some item id', 3)

      // Assert
      expect(actor.inventory).toEqual({ 'some item id': 2 })
      expect(map.addItem).toHaveBeenCalledWith([0, 1], 'some item id', 3)
    })

    it('should not drop more items than actor has', () => {

      // Arrange
      const actor = new Actor()
      actor.position = [0, 1]
      actor.inventory = { 'some item id': 5 }

      // Act
      actor.dropItem('some item id', 7)

      // Assert
      expect(actor.inventory).toEqual({})
      expect(map.addItem).toHaveBeenCalledWith([0, 1], 'some item id', 5)
    })

    it('should not drop item if it\'s not in inventory', () => {

      // Arrange
      const actor = new Actor()

      // Act
      actor.dropItem('some item id')

      // Assert
      expect(map.addItem).not.toHaveBeenCalled()
    })

    it('should not drop null or negative quantity', () => {

      // Arrange
      const actor = new Actor()
      actor.inventory = { 'some item id': 5 }

      // Act
      actor.dropItem('some item id')
      actor.dropItem('some item id', -7)

      // Assert
      expect(actor.inventory).toEqual({ 'some item id': 5 })
      expect(map.addItem).not.toHaveBeenCalled()
    })

    it('should not drop if there\'s another item on tile', () => {

      // Arrange
      const actor = new Actor()
      actor.inventory = { 'some item id': 1 }
      global.map.getItem = jest.fn(() => ({ _id: 'another item id', quantity: 1 }))

      // Act
      actor.dropItem('some item id', 1)

      // Assert
      expect(actor.inventory).toEqual({ 'some item id': 1 })
    })

    it('should not drop more that tile allows', () => {

      // Arrange
      const actor = new Actor()
      actor.position = [1, 0]
      actor.inventory = { 'some item id': 3000 }
      global.map.getItem = jest.fn(() => ({ _id: 'some item id', quantity: 9000 }))

      // Act
      actor.dropItem('some item id', 1500)

      // Assert
      expect(actor.inventory).toEqual({ 'some item id': 2000 })
      expect(map.addItem).toHaveBeenCalledWith([1, 0], 'some item id', 1000)
    })
  })

  describe('removeFromInventory', () => {

    it('should sustract quantity from inventory', () => {

      // Arrange
      const actor = new Actor()
      actor.inventory = { 'some item id': 14 }

      // Act
      actor.removeFromInventory('some item id', 10)

      // Assert
      expect(actor.inventory['some item id']).toEqual(4)
    })

    it('should remove item from inventory if quantity equals total', () => {

      // Arrange
      const actor = new Actor()
      actor.inventory = { 'some item id': 14 }

      // Act
      actor.removeFromInventory('some item id', 14)

      // Assert
      expect(actor.inventory).toEqual({})
    })

    it('should remove item from inventory if quantity exceeds total', () => {

      // Arrange
      const actor = new Actor()
      actor.inventory = { 'some item id': 14 }

      // Act
      actor.removeFromInventory('some item id', 20)

      // Assert
      expect(actor.inventory).toEqual({})
    })
  })

  describe('increase stat', () => {

    it('should not accept negative values', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }
      jest.spyOn(actor, 'emit')

      // Act
      actor.increaseStat('hp', -15)

      // Assert
      expect(actor.hp).toBe(50)
      expect(actor.emit).not.toHaveBeenCalled()
    })

    it('shoud increase stat when value is positive', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }
      jest.spyOn(actor, 'emit')

      // Act
      actor.increaseStat('hp', 15)

      // Assert
      expect(actor.hp).toBe(65)
      expect(actor.emit).toHaveBeenCalledWith('STAT_CHANGED', 'hp', { current: 65, max: 100 })
    })

    it('should not increase over maximum', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }
      jest.spyOn(actor, 'emit')

      // Act
      actor.increaseStat('hp', 85)

      // Assert
      expect(actor.hp).toBe(100)
      expect(actor.emit).toHaveBeenCalledWith('STAT_CHANGED', 'hp', { current: 100, max: 100 })
    })

    it('should not emit event if stat did not change', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 100, max: 100 }
      jest.spyOn(actor, 'emit')

      // Act
      actor.increaseStat('hp', 9999)

      // Assert
      expect(actor.emit).not.toHaveBeenCalled()
    })
  })

  describe('decrease stat', () => {

    it('should not accept negative values', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }
      jest.spyOn(actor, 'emit')

      // Act
      actor.decreaseStat('hp', -15)

      // Assert
      expect(actor.hp).toBe(50)
      expect(actor.emit).not.toHaveBeenCalled()
    })

    it('should descrease stat when value is positive', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }
      jest.spyOn(actor, 'emit')

      // Act
      actor.decreaseStat('hp', 15)

      // Assert
      expect(actor.hp).toBe(35)
      expect(actor.emit).toHaveBeenCalledWith('STAT_CHANGED', 'hp', { current: 35, max: 100 })
    })

    it('should not decrease below zero', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 50, max: 100 }
      jest.spyOn(actor, 'emit')

      // Act
      actor.decreaseStat('hp', 85)

      // Assert
      expect(actor.hp).toBe(0)
      expect(actor.emit).toHaveBeenCalledWith('STAT_CHANGED', 'hp', { current: 0, max: 100 })
    })

    it('should not emit event if stat did not change', () => {

      // Arrange
      const actor = new Actor('some actor id')
      actor.stats.hp = { current: 0, max: 100 }
      jest.spyOn(actor, 'emit')

      // Act
      actor.decreaseStat('hp', 9999)

      // Assert
      expect(actor.emit).not.toHaveBeenCalled()
    })
  })

})