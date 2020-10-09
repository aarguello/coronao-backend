const Inventory = require('./inventory')

describe('inventory', () => {

  describe('constructor', () => {

    it('should be created empty', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 100 })

      // Assert
      expect(inventory.size()).toEqual(0)
    })

  })

  describe('add item', () => {

    let inventoryChangedEvent

    beforeEach(() => {
      inventoryChangedEvent = jest.fn()
    })

    it('should add item with quantity', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 100 })
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const added = inventory.addItem('some item id', 10)
      const count = inventory.count('some item id')

      // Assert
      expect(inventory.size()).toEqual(1)
      expect(count).toEqual(10)
      expect(added).toEqual(10)
      expect(inventoryChangedEvent).toHaveBeenCalledWith('some item id', 10)
    })

    it('should not add item when inventory is full', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 2, itemStackLimit: 100 })
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)
      inventory.addItem('item 1', 10)
      inventory.addItem('item 2', 15)

      // Act
      const added = inventory.addItem('item 3', 20)

      // Assert
      expect(inventory.size()).toEqual(2)
      expect(inventory.count('item 3')).toEqual(0)
      expect(added).toEqual(0)
      expect(inventoryChangedEvent).toHaveBeenLastCalledWith('item 2', 15)
    })

    it('should not add item when quantity is zero', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 2, itemStackLimit: 100 })
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const added = inventory.addItem('item 1', 0)

      // Assert
      expect(inventory.size()).toEqual(0)
      expect(inventory.count('item 1')).toEqual(0)
      expect(added).toEqual(0)
      expect(inventoryChangedEvent).not.toHaveBeenCalled()
    })

    it('should not add item when quantity is less than zero', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 2, itemStackLimit: 100 })
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const added = inventory.addItem('item 1', -5)

      // Assert
      expect(inventory.size()).toEqual(0)
      expect(inventory.count('item 1')).toEqual(0)
      expect(added).toEqual(0)
      expect(inventoryChangedEvent).not.toHaveBeenCalled()
    })

    it('should not increase item quantity over stack limit', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 3, itemStackLimit: 100 })
      inventory.addItem('some item id', 100)
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const added = inventory.addItem('some item id', 10)

      // Assert
      expect(inventory.count('some item id')).toEqual(100)
      expect(added).toEqual(0)
      expect(inventoryChangedEvent).not.toHaveBeenCalled()
    })

    it('should add as much items as it can', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 3, itemStackLimit: 100 })
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)
      inventory.addItem('some item id', 70)

      // Act
      const added = inventory.addItem('some item id', 50)

      // Assert
      expect(inventory.count('some item id')).toEqual(100)
      expect(added).toEqual(30)
      expect(inventoryChangedEvent).toHaveBeenLastCalledWith('some item id', 100)
    })
  })

  describe('remove item', () => {

    let inventoryChangedEvent

    beforeEach(() => {
      inventoryChangedEvent = jest.fn()
    })

    it('should sustract item quantity', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 100 })
      inventory.addItem('some item id', 10)
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const removed = inventory.removeItem('some item id', 8)

      // Assert
      expect(inventory.size()).toEqual(1)
      expect(inventory.count('some item id')).toEqual(2)
      expect(removed).toEqual(8)
      expect(inventoryChangedEvent).toHaveBeenLastCalledWith('some item id', 2)
    })

    it('should remove nothing items when item is not in inventory', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 100 })
      inventory.addItem('some item id', 3)
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const removed = inventory.removeItem('another item id', 10)

      // Assert
      expect(inventory.size()).toEqual(1)
      expect(inventory.count('another item id')).toEqual(0)
      expect(removed).toEqual(0)
      expect(inventoryChangedEvent).not.toHaveBeenCalled()
    })

    it('should remove nothing when quantity is zero', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 2, itemStackLimit: 100 })
      inventory.addItem('some item id', 3)
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const removed = inventory.removeItem('some item id', 0)

      // Assert
      expect(inventory.size()).toEqual(1)
      expect(inventory.count('some item id')).toEqual(3)
      expect(removed).toEqual(0)
      expect(inventoryChangedEvent).not.toHaveBeenCalled()
    })

    it('should remove nothing when quantity is less than zero', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 2, itemStackLimit: 100 })
      inventory.addItem('some item id', 3)
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const removed = inventory.removeItem('some item id', -5)

      // Assert
      expect(inventory.size()).toEqual(1)
      expect(inventory.count('some item id')).toEqual(3)
      expect(removed).toEqual(0)
      expect(inventoryChangedEvent).not.toHaveBeenCalled()
    })

    it('should remove item from inventory when quantity reaches zero', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 1, itemStackLimit: 100 })
      inventory.addItem('some item id', 10)
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const removed = inventory.removeItem('some item id', 10)

      // Assert
      expect(inventory.size()).toBe(0)
      expect(inventory.count('some item id')).toEqual(0)
      expect(removed).toBe(10)
      expect(inventoryChangedEvent).toHaveBeenLastCalledWith('some item id', 0)
    })

    it('should remove item from inventory when quantity goes below zero', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 1, itemStackLimit: 100 })
      inventory.addItem('some item id', 10)
      inventory.on('INVENTORY_CHANGED', inventoryChangedEvent)

      // Act
      const removed = inventory.removeItem('some item id', 15)

      // Assert
      expect(inventory.size()).toBe(0)
      expect(inventory.count('some item id')).toEqual(0)
      expect(removed).toBe(10)
      expect(inventoryChangedEvent).toHaveBeenLastCalledWith('some item id', 0)
    })
  })

  describe('get items', () => {

    it('should return empty list when inventory is empty', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 1000 })

      // Act
      const items = inventory.items()

      // Assert
      expect(items).toEqual([])
    })

    it('should return list of dictionaries representing each item', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 1000 })
      inventory.addItem('item 1', 5)
      inventory.addItem('item 2', 10)
      inventory.addItem('item 3', 8)
      inventory.removeItem('item 2', 3)

      // Act
      const items = inventory.items()

      // Assert
      expect(items).toEqual([
        { _id: 'item 1', quantity: 5 },
        { _id: 'item 2', quantity: 7 },
        { _id: 'item 3', quantity: 8 },
      ])
    })
  })

  describe('clear', () => {

    it('should remove all items', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 1000 })
      inventory.addItem('item 1', 5)
      inventory.addItem('item 2', 10)
      inventory.addItem('item 3', 8)
      inventory.removeItem('item 2', 3)

      // Act
      inventory.clear()

      // Assert
      expect(inventory.size()).toEqual(0)
      expect(inventory.hasItem('item 1')).toEqual(false)
      expect(inventory.hasItem('item 2')).toEqual(false)
      expect(inventory.hasItem('item 3')).toEqual(false)
    })
  })

})