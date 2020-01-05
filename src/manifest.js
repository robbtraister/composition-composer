#!/usr/bin/env node

'use strict'

const path = require('path')

const glob = require('glob')

const { projectRoot } = require('../env')

function getEntries({ base, outputs = [], levels = 1 }) {
  const fileNames = ['index'].concat(outputs || [])
  const fileGlob =
    fileNames.length > 1 ? `{${fileNames.join(',')}}` : fileNames[0]

  const files = [].concat(
    glob.sync(`${base}${'/*'.repeat(levels)}.{js,jsx}`),
    glob.sync(`${base}${'/*'.repeat(levels)}/${fileGlob}.{js,jsx}`)
  )

  return Object.assign(
    {},
    ...files.map(sourceFile => {
      const { dir, name } = path.parse(
        path
          .relative(base, sourceFile)
          .split(path.sep)
          .slice(0, levels)
          .join(path.sep)
      )

      return {
        [path.join(dir, name)]: `~/${path.relative(projectRoot, sourceFile)}`
      }
    })
  )
}

module.exports = () => {
  const componentBase = path.join(projectRoot, 'components')
  const contentBase = path.join(projectRoot, 'content')
  const outputs = getEntries({
    base: path.join(componentBase, 'outputs')
  })
  // const outputNames = Object.keys(outputs)

  return {
    components: {
      // outputs: Object.assign(
      //   {},
      //   ...outputNames.map((outputName) => {
      //     return {
      //       [outputName]: {
      //         chains: getEntries({ base: path.join(componentBase, 'chains'), outputs: outputName }),
      //         features: getEntries({ base: path.join(componentBase, 'features'), outputs: outputName, levels: 2 }),
      //         layouts: getEntries({ base: path.join(componentBase, 'layouts'), outputs: outputName }),
      //         outputs: {
      //           [outputName]: outputs[outputName]
      //         }
      //       }
      //     }
      //   })
      // )
      features: getEntries({
        base: path.join(componentBase, 'features'),
        levels: 2
      }),
      layouts: getEntries({ base: path.join(componentBase, 'layouts') }),
      outputs
    },
    content: {
      schemas: getEntries({ base: path.join(contentBase, 'schemas') }),
      sources: getEntries({ base: path.join(contentBase, 'sources') })
    }
  }
}

if (module === require.main) {
  console.log(JSON.stringify(module.exports(), null, 2))
}
