'use strict'

const childProcess = require('child_process')

const _spawn = (cmd, args, options) =>
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

const spawn = async (cmd, args, options) => {
  // spawn will throw on SIGINT
  try {
    await _spawn(cmd, args, options)
  } catch (e) {
    // ignore SIGINT
  }
}

module.exports = spawn
