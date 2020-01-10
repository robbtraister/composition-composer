'use strict'

const { projectRoot } = require('./environment')

const { manifest } = require('../src/utils/manifest')

module.exports = manifest({ projectRoot })
