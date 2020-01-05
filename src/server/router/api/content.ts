'use strict'

import express from 'express'

import { fetch } from '../../content'

export default function router(options) {
  const contentRouter = express()

  contentRouter.use('/fetch', async (req, res, next) => {
    res.send(await fetch(req.query))
  })

  return contentRouter
}
