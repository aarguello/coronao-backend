const fs  = require('fs')
const Map = require('./map.js')

describe('Map', () => {

  beforeAll(() => {

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

  describe('moveActor', () => {

    it('should move actor to new position', () => {

      // Arrange
      const map  = new Map('map-1-test')
      const user = { _id: 'some user id', type: 'USER' }
      const to   = [0, 0]

      // Act
      map.moveActor(user, null, to)

      // Arrange
      expect(map.coordinates[to].actor._id).toBe(user._id)
      expect(map.coordinates[to].actor.type).toBe(user.type)
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
      expect(map.coordinates[from].actor).toBeUndefined()
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
  })
})