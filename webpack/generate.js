'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

const { projectRoot } = require('./environment')

const {
  components,
  'content-sources': contentSources,
  outputs
} = require('./manifest')
const { unpack } = require('../build/utils/unpack')

function writeCollection(name, collection) {
  const outputFile = path.join(projectRoot, 'build', 'generated', `${name}.js`)

  childProcess.execSync(`mkdir -p '${path.dirname(outputFile)}'`)
  fs.writeFileSync(
    outputFile,
    `'use strict'

${unpack}

export default {
  ${Object.keys(collection)
    .filter(type => collection[type])
    .map(type => {
      return typeof collection[type] === 'string'
        ? `'${type}': unpack(require('${collection[type]}'))`
        : `'${type}': {
    ${Object.keys(collection[type])
      .filter(subtype => collection[type][subtype])
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
