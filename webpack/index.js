'use strict'

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')

const smp = new SpeedMeasurePlugin()

require('../babel.register')

module.exports = (env, argv) =>
  smp.wrap(
    [].concat(
      ...[]
        .concat(
          // server must be first because it contains webpack-dev-server
          require('./server') || [],
          require('./client') || []
        )
        .map(config =>
          config instanceof Function ? config(env, argv) : config
        )
    )
  )
