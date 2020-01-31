'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

const { projectRoot } = require('../../env')
const { unpack } = require('../../build/utils/unpack')

const { components, 'content-sources': contentSources, formats } = require('.')

function writeCollection(name, collection) {
  const formatFile = path.join(projectRoot, 'build', 'generated', `${name}.js`)

  childProcess.execSync(`mkdir -p '${path.dirname(formatFile)}'`)
  fs.writeFileSync(
    formatFile,
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

if (module === require.main) {
  writeCollection('components', components)
  writeCollection('content-sources', contentSources)
  writeCollection('formats', formats)
}
