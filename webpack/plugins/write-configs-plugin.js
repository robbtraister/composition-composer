'use strict'

const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const { writeFile } = require('../../build/utils/promises')

const PropTypes = require('prop-types')

function compareJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function getPropTypeConfig(propDef) {
  let result
  if (propDef.type) {
    return {
      type: propDef.type,
      // if `isRequired` method exists on propDef, then it wasn't called
      required: !('isRequired' in propDef)
    }
  }

  Object.entries(PropTypes).find(([typeName, Type]) => {
    if (propDef === Type) {
      result = { type: typeName, required: false }
      return true
    } else if (Type.isRequired && propDef === Type.isRequired) {
      result = { type: typeName, required: true }
      return true
    }
  })
  return result
}

async function writeComponentConfigs(srcDir, destDir) {
  const resource = path.join(srcDir, 'components')
  const components = require(resource).default

  const configs = {}
  Object.entries(components).forEach(([componentName, Component]) => {
    const componentConfigs = {}

    Object.entries(Component).forEach(([formatName, ComponentImpl]) => {
      if (ComponentImpl.propTypes) {
        Object.entries(ComponentImpl.propTypes).forEach(
          ([propName, propDef]) => {
            const propTypeConfig = getPropTypeConfig(propDef)
            if (propTypeConfig) {
              if (propName in componentConfigs) {
                if (!compareJson(propTypeConfig, componentConfigs[propName])) {
                  throw new Error(
                    `config conflict: ${componentName}.${propName}`
                  )
                }
              }
              componentConfigs[propName] = propTypeConfig
            }
          }
        )
      }
    })

    configs[componentName] = componentConfigs
  })

  // await here to ensure assets are available before compiling
  await writeFile(
    path.join(destDir, 'components', 'configs.json'),
    JSON.stringify({ configs }, null, 2)
  )
}

class WriteConfigsPlugin {
  constructor(srcDir, destDir) {
    this.srcDir = srcDir
    this.destDir = destDir
  }

  apply(compiler) {
    compiler.hooks.done.tap(this.constructor.name, this.exec.bind(this))
  }

  async exec() {
    // write config files
    await writeComponentConfigs(this.srcDir, this.destDir)

    exec(`rm -rf '${this.srcDir}'`)
  }
}

module.exports = WriteConfigsPlugin
