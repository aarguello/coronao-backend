const Actor = require('./actor')

test('Create actor', () => {

  // Arrange
  const actor = new Actor('some random id')

  // Assert
  expect(actor._id).toBe('some random id')
  expect(actor.hp).toBe(0)
  expect(actor.stats.hp.max).toBe(0)
})

test('it should pivot actor when moving', () => {

  // Arrange
  const actor = new Actor('')
  actor.position = [0, 0]
  global.map = { positions: {}, size: 2 }

  // Act
  actor.move('RIGHT')

  // Assert
  expect(actor.direction).toBe('RIGHT')
})

test('it should move actor when neighbour position is free', () => {

  // Arrange
  const actor = new Actor('')
  actor.position = [0, 0]
  global.map = { positions: {}, size: 2 }

  // Act
  actor.move('RIGHT')

  // Assert
  expect(actor.position).toEqual([1, 0])
})

test('it should not move actor when neighbour position is taken', () => {

  // Arrange
  const actor = new Actor('')
  actor.position = [0, 0]
  global.map = { positions: { '1,0': { USER: 'some other user'} }, size: 2 }

  // Act
  actor.move('RIGHT')

  // Assert
  expect(actor.position).toEqual([0, 0])
})
