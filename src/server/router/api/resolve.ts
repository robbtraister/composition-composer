'use strict'

import express from 'express'

import resolve from '../../resolve'

export default function router(options) {
  const contentRouter = express()

  contentRouter.use('/', async (req, res, next) => {
    const output = req.query.output
    const uri = req.query.uri
    res.send(await resolve({ uri, output }, options))
  })

  return contentRouter
}
