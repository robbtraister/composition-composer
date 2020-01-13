'use strict'

const path = require('path')

const { projectRoot } = require('./environment')

module.exports = require(path.join(projectRoot, 'build', 'manifest.json'))
