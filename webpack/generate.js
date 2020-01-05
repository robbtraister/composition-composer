'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

const env = require('../env')
const { projectRoot } = env

const {
  components,
  'content-sources': contentSources,
  outputs
} = require('./manifest')
const unpack = require('../src/utils/unpack')

function writeCollection(name, collection) {
  const outputFile = path.join(projectRoot, 'build', 'generated', `${name}.js`)

  childProcess.execSync(`mkdir -p '${path.dirname(outputFile)}'`)
  fs.writeFileSync(
    outputFile,
    `'use strict'

${unpack}

export default {
  ${Object.keys(collection)
    .map(type => {
      return typeof collection[type] === 'string'
        ? `'${type}': unpack(require('${collection[type]}'))`
        : `'${type}': {
    ${Object.keys(collection[type])
      .map(subtype => {
        return `'${subtype}': unpack(require('${collection[type][subtype]}'))`
      })
      .join(',\n    ')}
  }`
    })
    .join(',\n  ')}
}`
  )
}

writeCollection('components', components)
writeCollection('content-sources', contentSources)
writeCollection('outputs', outputs)
