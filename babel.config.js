
module.exports = (api) => {

  const presets = []
  const plugins = [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
  ]

  if (api.env('test')) {
    return { presets, plugins }
  }
}