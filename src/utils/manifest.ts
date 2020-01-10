'use strict'

import path from 'path'

import glob from 'glob'

export function manifest({ projectRoot }) {
  const srcRoot = path.join(projectRoot, 'src')

  function getProjectRelativeFile(sourceFile) {
    return sourceFile && `~/${path.relative(srcRoot, sourceFile)}`
  }

  function getEntries(base) {
    const files = [].concat(glob.sync(`${base}/**/*.{js,jsx,ts,tsx}`))

    return Object.assign(
      {},
      ...files.map(sourceFile => {
        const { dir, name } = path.parse(
          path
            .relative(base, sourceFile)
            .split(path.sep)
            .join(path.sep)
        )

        return {
          [path
            .join(dir, name)
            .replace(/[\\/]index$/, '')]: getProjectRelativeFile(sourceFile)
        }
      })
    )
  }

  function getComponentFile(componentName, outputNames) {
    return []
      .concat(
        ...outputNames.map(output =>
          glob.sync(
            `${path.join(
              srcRoot,
              'components'
            )}/${componentName}/${output}.{js,jsx,ts,tsx}`
          )
        ),
        glob.sync(
          `${path.join(srcRoot, 'components')}/${componentName}.{js,jsx,ts,tsx}`
        )
      )
      .find(c => c)
  }

  function getComponentNames(outputNames) {
    const componentNames = Object.keys(
      getEntries(path.join(srcRoot, 'components'))
    )

    return componentNames.filter(componentName => {
      const { dir, name } = path.parse(componentName)
      return !(outputNames.includes(name) && componentNames.includes(dir))
    })
  }

  function getOutputOptions(outputs) {
    return Object.keys(outputs).reduce((fallbacks, output) => {
      const Output = require(outputs[output].replace('~', srcRoot))
      switch (Output.fallbacks) {
        case null:
        case false:
          fallbacks[output] = [output]
          break
        case undefined:
        case true:
          fallbacks[output] = [output, 'default', 'index']
          break
        default:
          fallbacks[output] = [output].concat(Output.fallbacks)
      }
      return fallbacks
    }, {})
  }

  function getComponents(outputs) {
    const outputOptions = getOutputOptions(outputs)
    const outputNames = Object.keys(outputOptions)

    const componentNames = getComponentNames(outputNames)
    return Object.assign(
      {},
      ...componentNames.map(componentName => {
        return {
          [componentName]: Object.assign(
            {},
            ...outputNames.map(outputName => {
              return {
                [outputName]: getProjectRelativeFile(
                  getComponentFile(componentName, outputOptions[outputName])
                )
              }
            })
          )
        }
      })
    )
  }

  const outputs = getEntries(path.join(srcRoot, 'outputs'))
  return {
    components: getComponents(outputs),
    'content-sources': getEntries(path.join(srcRoot, 'content-sources')),
    outputs
  }
}

export default manifest
