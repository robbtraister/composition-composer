'use strict'

import express from 'express'

import { ControllerType } from '../../controller'

export default function router(controller: ControllerType) {
  const contentRouter = express()

  contentRouter.use('/fetch', async (req, res, next) => {
    try {
      const { source, query } = req.query as { query?: string; source?: string }
      const contentPromise = controller.fetch({
        source,
        query: JSON.parse(query)
      })
      const data = await contentPromise
      contentPromise.expires &&
        res.set('Expires', new Date(contentPromise.expires).toUTCString())
      res.send(data)
    } catch (error) {
      next(error)
    }
  })

  return contentRouter
}
