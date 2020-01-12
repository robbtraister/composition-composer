'use strict'

import compression from 'compression'
import express from 'express'

import Controller, { ControllerType } from './controller'
import router from './router'

import logger from '../utils/logger'

export default function app(options: Options = {}) {
  const app = express()

  const controller: ControllerType = new Controller(options)
  // app.set('controller', controller)

  app.disable('x-powered-by')

  app.use(compression())

  app.use(router(controller))

  app.use(
    (err, req, res, next) => {
      if (
        err.location &&
        err.statusCode &&
        err.statusCode >= 300 &&
        err.statusCode < 400
      ) {
        res.redirect(err.location)
      } else {
        next(err)
      }
    },
    (err, req, res, next) => {
      if (err.statusCode && err.statusCode < 500) {
        // if a request error, do not log entire stack trace
        logger.warn(err.message || err.body || err)
      } else {
        console.error(err)
      }
      next(err)
    },
    controller.isProd
      ? (err, req, res, next) => {
          res.sendStatus(err.statusCode || 500)
        }
      : (err, req, res, next) => {
          res.status(err.statusCode || 500).send(err.message || err.body || err)
        }
  )

  return app
}
