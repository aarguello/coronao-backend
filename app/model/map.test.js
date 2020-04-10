const fs  = require('fs')
const Map = require('./map.js')

describe('Map', () => {

  beforeAll(() => {

    global.config = { itemStackLimit: 10000 }

    const map = {
      width: 2,
      layers: [
        { name: 'collision-1', data: [0, 0, 1, 0] },
        { name: 'collision-2', data: [0, 0, 0, 1] },
      ],
      tilesets: [{
        tiles: [ { id: 0, properties: [{ name: "collides", value: true }] }]
      }]
    }

    fs.writeFileSync('app/assets/map-1-test.json', JSON.stringify(map), 'utf8')
  })

  afterAll(() => {
    fs.unlinkSync('app/assets/map-1-test.json')
  })

  describe('constructor', () => {

    it('should set name', () => {
      const map = new Map('map-1-test')
      expect(map.name).toBe('map-1-test')
    })

    it('should set size', () => {
      const map = new Map('map-1-test')
      expect(map.size).toBe(2)
    })
  })

  describe('getActor', () => {

    it('should return actor in position', () => {

      // Arrange
      const map = new Map('map-1-test')
      const user = { _id: 'some user id', type: 'USER' }
      map.moveActor(user, null, [1, 1])

      // Act
      const actor = map.getActor([1, 1])

      // Assert
      expect(actor).toBe(user)
    })

    it('should return undefined if no actor was found', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      const actor = map.getActor([0, 0])

      // Assert
      expect(actor).toBeUndefined() // Check with toBe
    })
  })

  describe('moveActor', () => {

    it('should move actor to new position', () => {

      // Arrange
      const map  = new Map('map-1-test')
      const user = { _id: 'some user id', type: 'USER' }
      const to   = [0, 0]

      // Act
      map.moveActor(user, null, to)

      // Arrange
      expect(map.getActor(to)).toBe(user)
    })

    it('should remove actor from previous position', () => {

      // Arrange
      const map  = new Map('map-1-test')
      const user = { _id: 'some user id', type: 'USER' }
      const from = [0, 0]
      const to   = [1, 1]

      // Act
      map.moveActor(user, null, from)
      map.moveActor(user, from, to)

      // Arrange
      expect(map.getActor(from)).toBeUndefined()
    })
  })

  describe('removeActor', () => {

    it('should remove actor from position', () => {

      // Arrange
      const map  = new Map('map-1-test')
      const user = { _id: 'some user id', type: 'USER' }
      map.moveActor(user, null, [1, 0])

      // Act
      map.removeActor([1, 0])

      // Assert
      expect(map.getActor([1, 0])).toBeUndefined()
    })
  })

  describe('getItem', () => {

    it('should return item in position', () => {

      // Arrange
      const map = new Map('map-1-test')
      map.addItem([1, 1], 'some item id', 14)

      // Act
      const item = map.getItem([1, 1])

      // Assert
      expect(item).toEqual({ _id: 'some item id', quantity: 14 })
    })

    it('should return undefined if no item was found', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      const item = map.getItem([1, 1])

      // Assert
      expect(item).toBeUndefined()
    })
  })

  describe('addItem', () => {

    it('should add item when tile is empty', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      map.addItem([0, 0], 'some item id', 5)

      // Assert
      expect(map.getItem([0, 0])).toEqual({ _id: 'some item id', quantity: 5 })
    })

    it('should increase quantity if same item lies on tile', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      map.addItem([0, 0], 'some item id', 5)
      map.addItem([0, 0], 'some item id', 7)

      // Assert
      expect(map.getItem([0, 0])).toEqual({ _id: 'some item id', quantity: 12 })
    })

    it('should not increase quantity over item stacking limit', () => {

      // Arrange
      const map = new Map('map-1-test')
      map.addItem([0, 0], 'some item id', 7000)

      // Act
      map.addItem([0, 0], 'some item id', 4000)
      map.addItem([1, 1], 'another item id', 12000)

      // Assert
      expect(map.getItem([0, 0])).toEqual({ _id: 'some item id', quantity: 10000 })
      expect(map.getItem([1, 1])).toEqual({ _id: 'another item id', quantity: 10000 })
    })

    it('should do nothing if there\'s another item on tile', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      map.addItem([0, 0], 'some item id', 5)
      map.addItem([0, 0], 'another item id', 7)

      // Assert
      expect(map.getItem([0, 0])).toEqual({ _id: 'some item id', quantity: 5 })
    })
  })

  describe('remove item', () => {

    it('should decrease item quantity in tile', () => {

      // Arrange
      const map = new Map('map-1-test')
      map.addItem([0, 0], 'some item id', 14)

      // Act
      map.removeItem([0, 0], 10)

      // Assert
      expect(map.getItem([0, 0])).toEqual({ _id: 'some item id', quantity: 4 })
    })

    it('should remove item from tile when quatity exceeds total', () => {

      // Arrange
      const map = new Map('map-1-test')
      map.addItem([0, 0], 'some item id', 8)
      map.addItem([1, 1], 'another item id', 13)

      // Act
      map.removeItem([0, 0], 8)
      map.removeItem([1, 1], 24)

      // Assert
      expect(map.getItem([0, 0])).toBeUndefined()
      expect(map.getItem([1, 1])).toBeUndefined()
    })
  })

  describe('collides', () => {

    it('should not collide with emptiness', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      const collides = map.collides([0, 0])

      // Assert
      expect(collides).toBe(false)
    })

    it('should collide with blocking tile', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      const collides = map.collides([1, 1])

      // Assert
      expect(collides).toBe(true)
    })

    it('should collide with actor', () => {

      // Arrange
      const map = new Map('map-1-test')
      map.moveActor({ _id: 'some user id', type: 'USER' }, null, [0, 0])

      // Act
      const collides = map.collides([0, 0])

      // Assert
      expect(collides).toBe(true)
    })

    it('should collide with position out of bounds', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      const leftCollision   = map.collides([-1, 0])
      const rightCollision  = map.collides([2, 0])
      const upperCollision  = map.collides([0, -1])
      const bottomCollision = map.collides([0, 2])

      // Assert
      expect(leftCollision).toBe(true)
      expect(rightCollision).toBe(true)
      expect(upperCollision).toBe(true)
      expect(bottomCollision).toBe(true)
    })
  })

  describe('collisions', () => {

    it('should return all colliding tiles', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      const collisions = map.collisions()

      // Assert
      expect(collisions).toEqual([[0, 1], [1, 1]])
    })

    it('should not return free tiles', () => {

      // Arrange
      const map = new Map('map-1-test')

      // Act
      const collisions = map.collisions()

      // Assert
      expect(collisions).not.toContainEqual([[0, 0], [1, 0]])
    })
  })

  describe('randomPosition', () => {

    it('should return free position in map', () => {

      // Act
      const map = new Map('map-1-test')

      // Act
      const position = map.randomPosition()

      // Assert
      expect([ [0, 0], [1, 0] ]).toContainEqual(position)
    })

    it('should not return colliding positions', () => {

      // Act
      const map = new Map('map-1-test')

      // Act
      const position = map.randomPosition()

      // Assert
      expect([ [0, 1], [1, 1] ]).not.toContainEqual(position)
    })
  })

  describe('neighbour', () => {

    const position = [1, 1]

    it('should return left neighbour', () => {
      const neighbour = Map.neighbour(position, 'LEFT')
      expect(neighbour).toEqual([0, 1])
    })

    it('should return right neighbour', () => {
      const neighbour = Map.neighbour(position, 'RIGHT')
      expect(neighbour).toEqual([2, 1])
    })

    it('should return upper neighbour', () => {
      const neighbour = Map.neighbour(position, 'UP')
      expect(neighbour).toEqual([1, 0])
    })

    it('should return bottom neighbour', () => {
      const neighbour = Map.neighbour(position, 'DOWN')
      expect(neighbour).toEqual([1, 2])
    })
  })

})