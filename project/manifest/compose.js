'use strict'

const path = require('path')

const glob = require('glob')

const fileExtensions = ['js', 'jsx', 'ts', 'tsx']
const fileExtensionGlob = `{${fileExtensions.join(',')}}`

function manifest({ projectRoot }) {
  require('./register')

  const srcRoot = path.join(projectRoot, 'src')

  function getProjectRelativeFile(sourceFile) {
    return sourceFile && `~/${path.relative(srcRoot, sourceFile)}`
  }

  function getEntries(base) {
    const files = [].concat(glob.sync(`${base}/**/*.${fileExtensionGlob}`))

    return Object.assign(
      {},
      ...files
        // ignore test files
        .filter(sourceFile => !/\.(spec|test)\.[^/.]+?$/.test(sourceFile))
        // ignore underscore-prefixed segments
        .filter(sourceFile => !/\/_/.test(sourceFile))
        .map(sourceFile => {
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
            )}/${componentName}/${output}.${fileExtensionGlob}`
          )
        ),
        glob.sync(
          `${path.join(
            srcRoot,
            'components'
          )}/${componentName}.${fileExtensionGlob}`
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

  function getFallbacks(srcFile) {
    const Output = require(srcFile.replace('~', srcRoot))

    const { fallbacks = true } = Output

    if (!fallbacks) {
      return []
    }

    if (fallbacks === true) {
      return ['index']
    }

    return fallbacks
  }

  function getComponents(outputs) {
    const outputNames = Object.keys(outputs)

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
                  getComponentFile(
                    componentName,
                    [outputName].concat(getFallbacks(outputs[outputName]))
                  )
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

module.exports = manifest
