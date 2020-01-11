'use strict'

import { Router } from 'express'

import { ControllerType } from '../controller'

export default function router(controller: ControllerType) {
  const router = Router()

  router.get('*', async (req, res, next) => {
    const uri = req.originalUrl
    const output = req.query.output || 'default'
    const { body, contentType } = await controller.render(
      await controller.resolve({ uri, output })
    )
    res.set('Content-Type', contentType).send(body)
  })

  return router
}
