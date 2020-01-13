'use strict'

const path = require('path')

const { projectRoot } = require('../environment')

module.exports = {
  resolve: {
    alias: {
      '~': path.join(projectRoot, 'src'),
      ...require('../../aliases')
    },
    extensions: [
      '.tsx',
      '.ts',
      '.es6x',
      '.es6',
      '.esx',
      '.es',
      '.mjsx',
      '.mjs',
      '.jsx',
      '.js',
      '.cjsx',
      '.cjs',
      '.yaml',
      '.yml',
      '.json',
      '.scss',
      '.sass',
      '.css'
    ]
  }
}
