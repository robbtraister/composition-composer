'use strict'

import { Router } from 'express'
import passport from 'passport'
import FacebookStrategy from 'passport-facebook'

import { authenticate } from './jwt'

import { ControllerType } from '../../controller'

const defaultRedirect = '/'
const FACEBOOK_NAME = 'facebook'

export default (controller: ControllerType) => {
  const {
    auth: {
      providers: { facebook }
    },
    host
  } = controller

  if (facebook) {
    passport.use(
      FACEBOOK_NAME,
      new FacebookStrategy(
        {
          ...facebook,
          callbackURL: `${host}/auth/facebook`,
          profileFields: ['displayName', 'email', 'name']
        },
        function(accessToken, refreshToken, profile, done) {
          done(null, {
            email: profile.emails[0].value,
            name: profile.name.givenName || profile.displayName
          })
        }
      )
    )

    const router = Router()

    router.use((req, res, next) =>
      authenticate(FACEBOOK_NAME, {
        ...controller.auth,
        scope: ['email'], // , 'profile'],
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
