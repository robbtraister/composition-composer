'use strict'

const { projectRoot } = require('./environment')

module.exports = require('../src/utils/manifest')({ projectRoot })
