'use strict'

const path = require('path')

const { projectRoot } = require('../../env')

const manifestFile = path.resolve(projectRoot, 'build', 'manifest.json')

if (module === require.main) {
  const { writeFile } = require('../../build/utils/promises')

  const manifestJSON = JSON.stringify(
    require('./compose')({ projectRoot }),
    null,
    2
  )
  writeFile(manifestFile, manifestJSON)

  if (!process.argv.includes('--quiet')) {
    console.log(manifestJSON)
  }
} else {
  module.exports = require(manifestFile)
}
