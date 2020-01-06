'use strict'

import express from 'express'

import content from './content'
import resolve from './resolve'

import { Server as ServerError } from '../../errors'

import { sendMessage } from '../../messages'

export default function router(options) {
  const apiRouter = express()

  apiRouter.use('/content', content(options))

  apiRouter.use('/csrf', (req, res, next) => {
    res.send({ csrf: req.csrfToken() })
  })

  apiRouter.use(['/error/:code(\\d+)', '/error'], (req, res, next) => {
    next(new ServerError(+req.params.code || 500))
  })

  apiRouter.use('/resolve', resolve(options))

  apiRouter.post('/restart', async (req, res, next) => {
    try {
      await sendMessage({ type: 'restart' })
      res.sendStatus(200)
    } catch (err) {
      next(err)
    }
  })

  apiRouter.use('/uri', (req, res, next) => {
    res.send({ uri: req.originalUrl })
  })

  return apiRouter
}
