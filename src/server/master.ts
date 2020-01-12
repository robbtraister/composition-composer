'use strict'

import cluster from 'cluster'

import logger from '../utils/logger'

import { workerCount as envWorkerCount } from '../../env'

cluster.setupMaster({
  // eslint-disable-next-line no-eval
  exec: eval('__dirname')
})

async function createWorker(log = true) {
  return new Promise(resolve => {
    const worker = cluster.fork()
    // add an exit handler so cluster will replace worker in the event of an unintentional termination
    worker.on('exit', () => {
      worker.exitedAfterDisconnect || createWorker()
    })
    worker.on('listening', () => {
      log && logger.info(`Replacement worker created`)
      resolve()
    })
  })
}

export async function master(options: Options = {}) {
  const workerCount = Number(options.workerCount) || envWorkerCount

  const result = await Promise.all(
    [...new Array(workerCount)].map(createWorker.bind(null, false))
  )
  logger.info(`${workerCount} worker${workerCount === 1 ? '' : 's'} created`)

  return result
}

export function main(options: Options = {}) {
  process.title = `Composition Master [${process.pid}]`
  return master(options)
}

export default master

// use eval and __filename instead of module to preserve functionality in webpack artifact
// eslint-disable-next-line no-eval
const isScript = eval('require.main && (require.main.filename === __filename)')
isScript && main()
