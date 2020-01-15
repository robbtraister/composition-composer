'use strict'

import express from 'express'

import { ControllerType } from '../../controller'

export default function router(controller: ControllerType) {
  const contentRouter = express()

  contentRouter.use('/fetch', async (req, res, next) => {
    const { source, query } = req.query
    res.send(await controller.fetch({ source, query: JSON.parse(query) }))
  })

  return contentRouter
}
