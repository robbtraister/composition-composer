'use strict'

const childProcess = require('child_process')
const path = require('path')

const { projectRoot } = require('../env')

const cliRoot = path.resolve(__dirname)
const compositionRoot = path.resolve(__dirname, '..')

const spawn = (cmd, args, options) =>
  new Promise((resolve, reject) => {
    const proc = /^win/i.test(process.platform)
      ? childProcess.spawn('cmd', ['/s', '/c', cmd].concat(args), options)
      : childProcess.spawn(cmd, args, options)

    const sigintListener = () => {
      proc.kill('SIGINT')
    }
    process.once('SIGINT', sigintListener)

    proc.on('exit', code => {
      process.removeListener('SIGINT', sigintListener)
      // ensure cursor is returned
      process.stdout.write('\x1B[?25h')

      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${code}`))
      }
    })
  })

const npm = cmd =>
  async function npm(_, options = []) {
    if (options.length > 0 && options[0] !== '--') {
      options.unshift('--')
    }

    // spawn will throw on SIGINT
    try {
      await spawn('npm', ['run', '--prefix', cliRoot, cmd, ...options], {
        cwd: projectRoot,
        env: {
          ...process.env,
          COMPOSITION_ROOT: compositionRoot,
          PROJECT_ROOT: projectRoot
        },
        stdio: 'inherit'
      })
    } catch (e) {
      // ignore SIGINT
    }
  }

module.exports = npm
