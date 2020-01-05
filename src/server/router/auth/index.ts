'use strict'

import { Router } from 'express'
import passport from 'passport'

import facebook from './facebook'
import google from './google'
import jwt from './jwt'

import { Redirect, Unauthenticated, Unauthorized } from '../../errors'

passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user))
})

passport.deserializeUser(function(token, done) {
  done(null, JSON.parse(token))
})

export default function router(options: Options) {
  const router = Router()

  if (!options.auth) {
    router.use('/auth', (req, res, next) => {
      res.sendStatus(404)
    })

    router.use((req, res, next) => {
      req.user = { name: 'public' }
      next()
    })
  } else {
    router.use(/(\/auth)?\/(log|sign)out/, (req, res, next) => {
      res.clearCookie(options.auth.cookie)
      next(new Redirect('/'))
    })

    router.use(passport.initialize({}))

    options.auth.providers.facebook &&
      router.use('/auth/facebook', facebook(options))
    options.auth.providers.google && router.use('/auth/google', google(options))

    router.use(jwt(options))

    router.use((req, res, next) => {
      // ensure user is defined
      req.user = req.user || null
      next()
    })

    router.use(/(\/auth)?\/use?r/, (req, res, next) => {
      req.query.jsonp && /^[$_a-z][$_a-z0-9]*$/i.test(req.query.jsonp)
        ? res.send(`/**/;${req.query.jsonp}(${JSON.stringify(req.user)})`)
        : res.send({ user: req.user })
    })
  }

  return router
}

export const verify = (verifyFn = user => true) => (req, res, next) => {
  const { user } = req
  if (user) {
    if (verifyFn(user)) {
      next()
    } else {
      next(new Unauthorized())
    }
  } else {
    next(new Unauthenticated())
  }
}
