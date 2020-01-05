'use strict'

import { Router } from 'express'

import render from '../render'

export default function router(options: Options) {
  const router = Router()

  router.get('*', async (req, res, next) => {
    res.send(
      await render(
        {
          template: 'article',
          output: req.query.output || 'default',
          location: req.originalUrl
        },
        options
      )
    )
  })

  return router
}
