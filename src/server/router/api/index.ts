'use strict'

import express from 'express'

import content from './content'

import { Server as ServerError } from '../../errors'
import { ControllerType } from '../../controller'

export default function router(controller: ControllerType) {
  const apiRouter = express()

  apiRouter.use('/content', content(controller))

  apiRouter.use(['/error/:code(\\d+)', '/error'], (req, res, next) => {
    next(new ServerError(+req.params.code || 500))
  })

  apiRouter.use('/resolve', async (req, res, next) => {
    const output = req.query.output
    const uri = req.query.uri
    res.send(await controller.resolve({ uri, output }))
  })

  apiRouter.use('/uri', (req, res, next) => {
    res.send({ uri: req.originalUrl })
  })

  return apiRouter
}
