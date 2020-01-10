'use strict'

import cookieParser from 'cookie-parser'
import csurf from 'csurf'
import express from 'express'

import api from './api'
import assets from './assets'
import auth, { verify } from './auth'
import render from './render'

import { ControllerType } from '../controller'

export default function router(controller: ControllerType) {
  const router = express()

  router.use(assets(controller))

  router.use(cookieParser())

  // don't serve under '/auth' because we need to run authorization on all endpoints
  router.use(auth(controller))

  router.use(csurf({ cookie: true }))

  router.use('/api', controller.auth ? verify() : [], api(controller))

  router.use(
    // reserved paths that should not be rendered
    /^(?!\/(api|auth|dist|logout|signout|use?r)(\/|$))/,
    render(controller)
  )

  return router
}
