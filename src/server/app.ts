'use strict'

import compression from 'compression'
import express from 'express'

import router from './router'

import env from '../../env'
import Controller from './controller'

export default function app(inputOptions: Options = {}) {
  const options = Object.assign({}, env, inputOptions)

  const app = express()

  app.set('options', options)
  app.set('controller', new Controller(options))

  app.disable('x-powered-by')

  app.use(compression())

  app.use(router(options))

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
    options.logging
      ? (err, req, res, next) => {
          if (err.statusCode && err.statusCode < 500) {
            // if a request error, do not log entire stack trace
            console.log(err.message || err.body || err)
          } else {
            console.error(err)
          }
          next(err)
        }
      : [],
    options.isProd
      ? (err, req, res, next) => {
          res.sendStatus(err.statusCode || 500)
        }
      : (err, req, res, next) => {
          res.status(err.statusCode || 500).send(err.message || err.body || err)
        }
  )

  return app
}
