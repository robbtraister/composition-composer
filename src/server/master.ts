'use strict'

import cluster from 'cluster'

import debugModule from 'debug'

import * as env from '../../env'

const debug = debugModule('composition:master')

async function createWorker() {
  return new Promise(resolve => {
    const worker = cluster.fork()
    // add an exit handler so cluster will replace worker in the event of an unintentional termination
    worker.on('exit', createWorker)
    worker.on('listening', resolve)
  })
}

async function createWorkers(n = env.workerCount) {
  return Promise.all([...new Array(n)].map(createWorker))
}

async function terminateWorker(
  worker,
  gracefulDelay = 5000,
  forcefulDelay = 10000
) {
  return new Promise(resolve => {
    // this worker is being purposely terminated; do not auto-replace it
    worker.off('exit', createWorker)

    worker.on('exit', resolve)

    worker.disconnect()

    setTimeout(() => {
      worker.kill()
    }, gracefulDelay)
    setTimeout(() => {
      worker.process.kill()
    }, forcefulDelay)
  })
}

export async function cycleWorkers() {
  const { workerCount = env.workerCount } = cluster.settings
  const oldWorkers = Object.values(cluster.workers)

  const result = await createWorkers(workerCount)

  debug(`${workerCount} worker${workerCount === 1 ? '' : 's'} Created`)

  const oldWorkerCount = oldWorkers.length
  if (oldWorkerCount) {
    Promise.all(oldWorkers.map(worker => terminateWorker(worker))).then(() => {
      debug(
        `${oldWorkerCount} worker${oldWorkerCount === 1 ? '' : 's'} Terminated`
      )
    })
  }

  return result
}

async function messageHandler(proc, msg: Message = {}) {
  const { id, type, action } = msg

  if (
    msg === 'restart' ||
    type === 'restart' ||
    (type === 'action' && action === 'restart')
  ) {
    try {
      await cycleWorkers()

      proc.send({ id, type: 'complete' })
    } catch (error) {
      proc.send({ id, type: 'error', error })
    }
  } else {
    proc.send({ id, type: 'unknown' })
  }
}

export async function master(options: Options = {}) {
  const workerCount = Number(options.workerCount) || env.workerCount

  cluster.setupMaster({ workerCount })

  cluster.on('message', messageHandler)

  return cycleWorkers()
}

export default master
