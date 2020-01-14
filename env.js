'use strict'

const fs = require('fs')
const path = require('path')

const DISABLED_PATTERN = /^(disabled?|false|no|off|0)$/i
// const ENABLED_PATTERN = /^(enabled?|true|yes|on|1)$/i

function prefix(dir = '.') {
  function _prefix(dir) {
    if (
      fs.existsSync(path.join(dir, 'package.json')) ||
      fs.existsSync(path.join(dir, 'node_modules'))
    ) {
      return dir
    } else {
      const nextDir = path.dirname(dir)
      if (nextDir !== dir) {
        return _prefix(nextDir)
      }
      throw new Error('no npm prefix')
    }
  }

  return _prefix(path.resolve(dir))
}

const projectRoot = prefix(
  process.env.PROJECT_ROOT || process.env.INIT_CWD || '.'
)

require('dotenv').config({ path: path.join(projectRoot, '.env') })

const { config = {} } = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'))
)

const isProd = /^prod/i.test(process.env.NODE_ENV)

module.exports = {
  isPreact: !DISABLED_PATTERN.test(process.env.PREACT),

  isProd,

  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),

  mongoUrl: process.env.MONGO_URL,

  port: Number(process.env.PORT) || Number(config.port) || 8080,

  projectRoot,

  workerCount: isProd
    ? Number(process.env.WORKER_COUNT) ||
      Number(config.workerCount) ||
      require('os').cpus().length ||
      1
    : 1
}
