'use strict'

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

const env = require('../env')
const { projectRoot } = env

const { components, content } = require('../src/manifest')()
const unpack = require('../src/utils/unpack')

function writePurpose(name, purpose) {
  const outputFile = path.join(projectRoot, 'build', 'generated', `${name}.js`)

  childProcess.execSync(`mkdir -p '${path.dirname(outputFile)}'`)
  fs.writeFileSync(
    outputFile,
    `'use strict'

${unpack}

export default {
  ${Object.keys(purpose)
    .map(collection => {
      return `'${collection}': {
    ${Object.keys(purpose[collection])
      .map(type => `'${type}': unpack(require('${purpose[collection][type]}'))`)
      .join(',\n    ')}
  }`
    })
    .join(',\n  ')}
}
`
  )
}

writePurpose('components', components)
writePurpose('content', content)
