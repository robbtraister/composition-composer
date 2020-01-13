'use strict'

const path = require('path')

const babelRegister = require('@babel/register')
const glob = require('glob')
const mockRequire = require('mock-require')

const aliases = require('../../aliases')
const { projectRoot } = require('../../env')

let registered = false
function register() {
  if (!registered) {
    babelRegister({
      root: path.resolve(__dirname, '..', '..'),
      ignore: [/[\\/]node_modules[\\/](?!@composition[\\/])/],
      only: [
        path.resolve(__dirname, '..', '..', 'src'),
        path.join(projectRoot, 'src')
      ],

      extensions: [
        '.tsx',
        '.ts',
        '.es6x',
        '.es6',
        '.esx',
        '.es',
        '.mjsx',
        '.mjs',
        '.jsx',
        '.js',
        '.cjsx',
        '.cjs'
      ]
    })

    Object.entries(aliases).forEach(([key, value]) =>
      mockRequire(key, require(value))
    )

    registered = true
  }
}

function manifest({ projectRoot }) {
  register()

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

  function getFallbacks(srcFile) {
    const Output = require(srcFile.replace('~', srcRoot))

    switch (Output.fallbacks) {
      case null:
      case false:
        return null
      case undefined:
      case true:
        return ['default', 'index']
      default:
        return Output.fallbacks
    }
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