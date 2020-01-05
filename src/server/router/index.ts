'use strict'

import cookieParser from 'cookie-parser'
import csurf from 'csurf'
import express from 'express'

import api from './api'
import assets from './assets'
import auth, { verify } from './auth'
import render from './render'

export default function router(options: Options) {
  const router = express()

  router.use(assets(options))

  router.use(cookieParser())

  // don't serve under '/auth' because we need to run authorization on all endpoints
  router.use(auth(options))

  router.use(csurf({ cookie: true }))

  router.use('/api', options.auth ? verify() : [], api(options))

  router.use(
    // reserved paths that should not be rendered
    /^(?!\/(api|auth|dist|logout|signout|use?r)(\/|$))/,
    render(options)
  )

  return router
}
