'use strict'

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')

const smp = new SpeedMeasurePlugin()

module.exports = (env, argv) =>
  smp.wrap(
    [].concat(
      ...[]
        .concat(require('./server') || [], require('./client') || [])
        .map(config =>
          config instanceof Function ? config(env, argv) : config
        )
    )
  )
