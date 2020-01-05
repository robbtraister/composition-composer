'use strict'

import { Router } from 'express'

import render from '../render'

export default function router(options: Options) {
  const router = Router()

  router.get('*', async (req, res, next) => {
    const { body, contentType } = await render(
      {
        template: 'article',
        output: req.query.output || 'default',
        location: req.originalUrl
      },
      options
    )
    res.set('Content-Type', contentType).send(body)
  })

  return router
}
