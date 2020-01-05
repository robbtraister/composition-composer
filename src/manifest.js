#!/usr/bin/env node

'use strict'

const path = require('path')

const glob = require('glob')

const { projectRoot } = require('../env')

function getProjectRelativeFile(sourceFile) {
  return sourceFile && `~/${path.relative(projectRoot, sourceFile)}`
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

function getComponentFile(componentName, outputName) {
  return []
    .concat(
      glob.sync(
        `${path.join(
          projectRoot,
          'components'
        )}/${componentName}/${outputName}.{js,jsx,ts,tsx}`
      ),
      glob.sync(
        `${path.join(
          projectRoot,
          'components'
        )}/${componentName}/index.{js,jsx,ts,tsx}`
      ),
      glob.sync(
        `${path.join(
          projectRoot,
          'components'
        )}/${componentName}.{js,jsx,ts,tsx}`
      )
    )
    .find(c => c)
}

function getComponentNames(outputNames) {
  const componentNames = Object.keys(
    getEntries(path.join(projectRoot, 'components'))
  )

  return componentNames.filter(componentName => {
    const { dir, name } = path.parse(componentName)
    return !(outputNames.includes(name) && componentNames.includes(dir))
  })
}

function getComponents(outputNames) {
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
                getComponentFile(componentName, outputName)
              )
            }
          })
        )
      }
    })
  )
}

module.exports = () => {
  const outputs = getEntries(path.join(projectRoot, 'outputs'))
  return {
    components: getComponents(Object.keys(outputs)),
    'content-sources': getEntries(path.join(projectRoot, 'content-sources')),
    outputs
  }
}

if (module === require.main) {
  console.log(JSON.stringify(module.exports(), null, 2))
}
