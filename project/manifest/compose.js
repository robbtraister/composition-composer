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
            path.relative(base, sourceFile).split(path.sep).join(path.sep)
          )

          return {
            [path
              .join(dir, name)
              .replace(/[\\/]index$/, '')]: getProjectRelativeFile(sourceFile)
          }
        })
    )
  }

  function getComponentFile(componentName, formatNames) {
    return []
      .concat(
        ...formatNames.map(format =>
          glob.sync(
            `${path.join(
              srcRoot,
              'components'
            )}/${componentName}/${format}.${fileExtensionGlob}`
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

  function getComponentNames(formatNames) {
    const componentNames = Object.keys(
      getEntries(path.join(srcRoot, 'components'))
    )

    return componentNames.filter(componentName => {
      const { dir, name } = path.parse(componentName)
      return !(formatNames.includes(name) && componentNames.includes(dir))
    })
  }

  function getFallbacks(srcFile) {
    const Format = require(srcFile.replace('~', srcRoot))

    const { fallbacks = true } = Format

    if (!fallbacks) {
      return []
    }

    if (fallbacks === true) {
      return ['index']
    }

    return fallbacks
  }

  function getComponents(formats) {
    const formatNames = Object.keys(formats)

    const componentNames = getComponentNames(formatNames)
    return Object.assign(
      {},
      ...componentNames.map(componentName => {
        return {
          [componentName]: Object.assign(
            {},
            ...formatNames.map(formatName => {
              return {
                [formatName]: getProjectRelativeFile(
                  getComponentFile(
                    componentName,
                    [formatName].concat(getFallbacks(formats[formatName]))
                  )
                )
              }
            })
          )
        }
      })
    )
  }

  const formats = getEntries(path.join(srcRoot, 'formats'))
  return {
    components: getComponents(formats),
    'content-sources': getEntries(path.join(srcRoot, 'content-sources')),
    formats
  }
}

module.exports = manifest
