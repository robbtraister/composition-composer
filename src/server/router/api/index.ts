'use strict'

import express from 'express'

import content from './content'

import { sendMessage } from '../../messages'

export default function router(options) {
  const apiRouter = express()

  apiRouter.use('/content', content(options))

  apiRouter.use('/csrf', (req, res, next) => {
    res.send({ csrf: req.csrfToken() })
  })

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
