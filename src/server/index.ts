'use strict'

import cluster from 'cluster'

import app from './app'

import logger from '../utils/logger'

import * as env from '../../env'

export { app }

export function server(options: Options = {}) {
  process.on('disconnect', () => {
    logger.info(`Worker[${process.pid}] disconnected`)
  })
  process.on('exit', code => {
    logger.info(`Worker[${process.pid}] exited with code: ${code}`)
  })

  const port = Number(options.port) || env.port

  return app(options).listen(port, err =>
    err
      ? console.error(err)
      : logger.info(`Worker[${process.pid}] listening on port: ${port}`)
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
  logger.info(`${workerCount} worker${workerCount === 1 ? '' : 's'} Created`)

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
