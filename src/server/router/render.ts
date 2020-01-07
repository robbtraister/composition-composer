'use strict'

import { Router } from 'express'

import render from '../render'
import resolve from '../resolve'

export default function router(options: Options) {
  const router = Router()

  router.get('*', async (req, res, next) => {
    const uri = req.originalUrl
    const output = req.query.output
    const { body, contentType } = await render(
      await resolve({ uri, output }, options),
      options
    )
    res.set('Content-Type', contentType).send(body)
  })

  return router
}
