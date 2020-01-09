'use strict'

import { Router } from 'express'

export default function router(options: Options) {
  const router = Router()

  router.get('*', async (req, res, next) => {
    const uri = req.originalUrl
    const output = req.query.output
    const controller = req.app.get('controller')
    const { body, contentType } = await controller.render(
      await controller.resolve({ uri, output })
    )
    res.set('Content-Type', contentType).send(body)
  })

  return router
}
