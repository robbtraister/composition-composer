'use strict'

import debugModule from 'debug'

import app from './app'

import * as env from '../../env'

const debug = debugModule(`composition:worker:${process.pid}`)

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

export default server

// use eval and __filename instead of module to preserve functionality in webpack artifact
// eslint-disable-next-line no-eval
const isScript = eval('require.main && (require.main.filename === __filename)')
isScript && server()
