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

    it('should add item with quantity', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 100 })

      // Act
      const added = inventory.addItem('some item id', 10)

      // Assert
      expect(inventory.size()).toEqual(1)
      expect(inventory.itemQuantity('some item id')).toEqual(10)
      expect(added).toEqual(10)
    })

    it('should not add item when inventory is full', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 2, itemStackLimit: 100 })
      inventory.addItem('item 1', 10)
      inventory.addItem('item 2', 15)

      // Act
      const added = inventory.addItem('item 3', 20)

      // Assert
      expect(inventory.size()).toEqual(2)
      expect(inventory.itemQuantity('item 3')).toEqual(0)
      expect(added).toEqual(0)
    })

    it('should not increase item quantity over stack limit', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 3, itemStackLimit: 100 })
      inventory.addItem('some item id', 100)

      // Act
      const added = inventory.addItem('some item id', 10)

      // Assert
      expect(inventory.itemQuantity('some item id')).toEqual(100)
      expect(added).toEqual(0)
    })

    it('should add as much items as it can', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 3, itemStackLimit: 100 })
      inventory.addItem('some item id', 70)

      // Act
      const added = inventory.addItem('some item id', 50)

      // Assert
      expect(inventory.itemQuantity('some item id')).toEqual(100)
      expect(added).toEqual(30)
    })
  })

  describe('remove item', () => {

    it('should sustract item quantity', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 100 })
      inventory.addItem('some item id', 10)

      // Act
      const removed = inventory.removeItem('some item id', 8)

      // Assert
      expect(inventory.size()).toEqual(1)
      expect(inventory.itemQuantity('some item id')).toEqual(2)
      expect(removed).toEqual(8)
    })

    it('should remove nothing items when item is not in inventory', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 5, itemStackLimit: 100 })
      inventory.addItem('some item id', 3)

      // Act
      const removed = inventory.removeItem('another item id', 10)

      // Assert
      expect(inventory.size()).toEqual(1)
      expect(inventory.itemQuantity('another item id')).toEqual(0)
      expect(removed).toEqual(0)
    })

    it('should remove item from inventory when quantity reaches zero', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 1, itemStackLimit: 100 })
      inventory.addItem('some item id', 10)

      // Act
      const removed = inventory.removeItem('some item id', 10)

      // Assert
      expect(inventory.size()).toBe(0)
      expect(inventory.itemQuantity('some item id')).toEqual(0)
      expect(removed).toBe(10)
    })

    it('should remove item from inventory when quantity goes below zero', () => {

      // Arrange
      const inventory = new Inventory({ capacity: 1, itemStackLimit: 100 })
      inventory.addItem('some item id', 10)

      // Act
      const removed = inventory.removeItem('some item id', 15)

      // Assert
      expect(inventory.size()).toBe(0)
      expect(inventory.itemQuantity('some item id')).toEqual(0)
      expect(removed).toBe(10)
    })
  })
})