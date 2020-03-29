const Actor = require('./actor')

test('Create actor', () => {
  const actor = new Actor('some random id')
  expect(actor._id).toBe('some random id')
  expect(actor.hp).toBe(0)
  expect(actor.stats.hp.max).toBe(0)
})


