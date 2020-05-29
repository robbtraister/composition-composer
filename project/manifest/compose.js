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
    return Object.assign(
      {},
      ...[]
        .concat(glob.sync(`${base}/**/*.${fileExtensionGlob}`))
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
        }),
      ...[].concat(glob.sync(`${base}/**/package.json`)).map(packageFile => {
        const { dir } = path.parse(path.relative(base, packageFile))

        return {
          [dir]: getProjectRelativeFile(dir)
        }
      })
    )
  }

  function getComponentFile(componentName, format, fallbacks = []) {
    const componentRoot = path.join(srcRoot, 'components')
    const componentPath = path.join(componentRoot, componentName)

    const definedFallbacks =
      fallbacks === true ? [] : [].concat(fallbacks || [])

    const options = [].concat(
      ...glob.sync(path.join(componentPath, `${format}/`)),
      ...glob.sync(path.join(componentPath, `${format}.${fileExtensionGlob}`)),
      ...definedFallbacks.map(fallback => [
        ...glob.sync(path.join(componentPath, `${fallback}/`)),
        ...glob.sync(
          path.join(componentPath, `${fallback}.${fileExtensionGlob}`)
        )
      ]),
      ...(fallbacks === true ? glob.sync(`${componentPath}/`) : []),
      ...glob.sync(
        path.join(componentRoot, `${componentName}.${fileExtensionGlob}`)
      )
    )

    return options.find(c => c)
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

    return fallbacks
  }

  function getComponents(formats) {
    const formatNames = Object.keys(formats)
    const fallbacks = Object.assign(
      {},
      ...formatNames.map(formatName => {
        return {
          [formatName]: getFallbacks(formats[formatName])
        }
      })
    )

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
                    formatName,
                    fallbacks[formatName]
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
