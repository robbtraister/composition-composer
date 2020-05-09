'use strict'

const path = require('path')

const spawn = require('./spawn')

const { projectRoot } = require('../env')

const cliRoot = path.resolve(__dirname)
const compositionRoot = path.dirname(cliRoot)

const npm = cmd =>
  async function npm(_, options = []) {
    if (options.length > 0 && options[0] !== '--') {
      options.unshift('--')
    }

    await spawn('npm', ['run', '--prefix', cliRoot, cmd, ...options], {
      cwd: projectRoot,
      env: {
        ...process.env,
        COMPOSITION_ROOT: compositionRoot,
        PROJECT_ROOT: projectRoot,
        BABEL_CACHE_PATH: path.resolve(
          projectRoot,
          'node_modules',
          '.cache',
          '@babel',
          'register',
          '.babel.json'
        )
      },
      stdio: 'inherit'
    })
  }

module.exports = npm
