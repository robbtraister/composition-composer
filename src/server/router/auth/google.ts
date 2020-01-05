'use strict'

import { Router } from 'express'
import passport from 'passport'
import GoogleStrategy from 'passport-google-oauth20'

import { authenticate } from './jwt'

const defaultRedirect = '/'
const GOOGLE_NAME = 'google'

export default (options: Options) => {
  const {
    auth: {
      providers: { google }
    },
    host
  } = options

  if (google) {
    passport.use(
      GOOGLE_NAME,
      new GoogleStrategy(
        {
          ...google,
          callbackURL: `${host}/auth/google`
        },
        function(accessToken, refreshToken, profile, done) {
          done(null, {
            email: profile.emails[0].value,
            name: profile.name.givenName
          })
        }
      )
    )

    const router = Router()

    router.use((req, res, next) =>
      authenticate(GOOGLE_NAME, {
        ...options.auth,
        scope: ['email', 'profile'],
        state: req.query.redirect
          ? JSON.stringify({ redirect: req.query.redirect })
          : undefined,
        successRedirect: req => {
          try {
            return JSON.parse(req.query.state).redirect || defaultRedirect
          } catch (_) {
            return defaultRedirect
          }
        }
      })(req, res, next)
    )

    return router
  } else {
    return (req, res, next) => {
      res.sendStatus(405)
    }
  }
}
