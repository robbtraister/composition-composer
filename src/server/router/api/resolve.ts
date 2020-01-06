'use strict'

import express from 'express'

export default function router(options) {
  const contentRouter = express()

  contentRouter.use('/', async (req, res, next) => {
    res.send({ tree: '', pageContent: '' })
  })

  return contentRouter
}
