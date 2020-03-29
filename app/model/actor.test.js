const Actor = require('./actor')

beforeEach(() => {
  global.map = { positions: {}, size: 2 }
})

test('Create actor', () => {

  // Arrange
  const actor = new Actor('some random id')

  // Assert
  expect(actor._id).toBe('some random id')
  expect(actor.hp).toBe(0)
  expect(actor.stats.hp.max).toBe(0)
})

test('it should pivot actor when moving to different direction', () => {

  // Arrange
  const actor     = new Actor('')
  actor.direction = 'DOWN'
  actor.position  = [0, 0]

  // Act
  const [ moved, pivoted ] = actor.move('RIGHT')

  // Assert
  expect(pivoted).toBe('RIGHT')
  expect(actor.direction).toBe('RIGHT')
})

test('it should not pivot actor when moving to same direction', () => {

  // Arrange
  const actor     = new Actor('')
  actor.direction = 'DOWN'
  actor.position  = [0, 0]

  // Act
  const [ moved, pivoted ] = actor.move('DOWN')

  // Assert
  expect(pivoted).toBe(false)
  expect(actor.direction).toBe('DOWN')
})

test('it should move actor when neighbour position is free', () => {

  // Arrange
  const actor = new Actor('')
  actor.position = [0, 0]

  // Act
  actor.move('RIGHT')

  // Assert
  expect(actor.position).toEqual([1, 0])
})

test('it should not move actor when neighbour position is taken', () => {

  // Arrange
  const actor = new Actor('')
  actor.position = [0, 0]
  global.map.positions = { '1,0': { USER: 'some other user'} }

  // Act
  actor.move('RIGHT')

  // Assert
  expect(actor.position).toEqual([0, 0])
})
