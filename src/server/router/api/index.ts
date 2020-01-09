'use strict'

import express from 'express'

import content from './content'

import { Server as ServerError } from '../../errors'

export default function router(options) {
  const apiRouter = express()

  apiRouter.use('/content', content(options))

  apiRouter.use('/csrf', (req, res, next) => {
    res.send({ csrf: req.csrfToken() })
  })

  apiRouter.use(['/error/:code(\\d+)', '/error'], (req, res, next) => {
    next(new ServerError(+req.params.code || 500))
  })

  apiRouter.use('/resolve', async (req, res, next) => {
    const output = req.query.output
    const uri = req.query.uri
    res.send(await req.app.get('controller').resolve({ uri, output }))
  })

  apiRouter.use('/uri', (req, res, next) => {
    res.send({ uri: req.originalUrl })
  })

  return apiRouter
}
