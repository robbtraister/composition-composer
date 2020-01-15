'use strict'

import cookieParser from 'cookie-parser'
import express from 'express'

import api from './api'
import assets from './assets'
import render from './render'

import { ControllerType } from '../controller'

export default function router(controller: ControllerType) {
  const router = express()

  router.use(assets(controller))

  router.use(cookieParser())

  router.use('/api', api(controller))

  router.use(
    // reserved paths that should not be rendered
    /^(?!\/(api|dist)(\/|$))/,
    render(controller)
  )

  return router
}
