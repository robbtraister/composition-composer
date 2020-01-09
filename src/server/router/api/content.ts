'use strict'

import express from 'express'

export default function router(options) {
  const contentRouter = express()

  contentRouter.use('/fetch', async (req, res, next) => {
    res.send(await req.app.get('controller').fetch(req.query))
  })

  return contentRouter
}
