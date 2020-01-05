'use strict'

module.exports = (env, argv) =>
  [].concat(
    ...[]
      .concat(require('./server') || [], require('./client') || [])
      .map(config => (config instanceof Function ? config(env, argv) : config))
  )
