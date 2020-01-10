'use strict'

import express from 'express'

import { ControllerType } from '../../controller'

export default function router(controller: ControllerType) {
  const contentRouter = express()

  contentRouter.use('/fetch', async (req, res, next) => {
    res.send(await controller.fetch(req.query))
  })

  return contentRouter
}
