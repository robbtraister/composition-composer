'use strict'

import app from './app'

import logger from '../utils/logger'

import { port as envPort } from '../../env'

export { app }

export function server(options: Options = {}) {
  process.on('disconnect', () => {
    logger.info(`Worker[${process.pid}] disconnected`)
  })
  process.on('exit', code => {
    logger.info(`Worker[${process.pid}] exited with code: ${code}`)
  })

  const port = Number(options.port) || envPort

  return app(options).listen(port, err =>
    err
      ? console.error(err)
      : logger.info(`Worker[${process.pid}] listening on port: ${port}`)
  )
}

export function main(options: Options = {}) {
  process.title = `Composition Server [${process.pid}]`
  return server(options)
}

export default server

// use eval and __filename instead of module to preserve functionality in webpack artifact
// eslint-disable-next-line no-eval
const isScript = eval('require.main && (require.main.filename === __filename)')
isScript && main()
