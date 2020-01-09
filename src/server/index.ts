'use strict'

import cluster from 'cluster'

import debugModule from 'debug'

import app from './app'

import * as env from '../../env'

const debug = debugModule(`composition:server:${process.pid}`)

export { app }

// cache the default app config for faster reload
export const devApp = env.isProd ? null : app()

export function server(options: Options = {}) {
  process.on('disconnect', () => {
    debug('Disconnected')
  })
  process.on('exit', code => {
    debug(`Exited with code: ${code}`)
  })

  const port = Number(options.port) || env.port

  return app(options).listen(port, err =>
    err ? console.error(err) : debug(`Listening on port: ${port}`)
  )
}

async function createWorker() {
  return new Promise(resolve => {
    const worker = cluster.fork()
    // add an exit handler so cluster will replace worker in the event of an unintentional termination
    worker.on('exit', () => {
      worker.exitedAfterDisconnect || createWorker()
    })
    worker.on('listening', resolve)
  })
}

export async function master(options: Options = {}) {
  const workerCount = Number(options.workerCount) || env.workerCount

  const result = await Promise.all(
    [...new Array(workerCount)].map(createWorker)
  )
  debug(`${workerCount} worker${workerCount === 1 ? '' : 's'} Created`)

  return result
}

export function main(options: Options = {}) {
  ;(cluster.isMaster ? master : server)(options)
}

export default server

// use eval and __filename instead of module to preserve functionality in webpack artifact
// eslint-disable-next-line no-eval
const isScript = eval('require.main && (require.main.filename === __filename)')
isScript && main()
