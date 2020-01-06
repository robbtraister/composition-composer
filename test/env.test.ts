'use strict'

/* global beforeEach, expect, jest, test */

import path from 'path'

beforeEach(() => {
  jest.resetModules()
})

test('verify env logic', () => {
  const env = require('../env')
  expect(env.isProd).toBe(false)
  expect(env.projectRoot).toBe(path.resolve(__dirname, '..'))
})

test('verify env logic', () => {
  Object.assign(process.env, {
    NODE_ENV: 'production',
    AUTH: 'enabled',
    PORT: 8080,
    SECRET: 'secret',
    COOKIE: 'cookie',
    HOST: 'localhost',
    WORKER_COUNT: 2,
    FACEBOOK_APP_ID: 'abc',
    FACEBOOK_APP_SECRET: 'def',
    GOOGLE_CLIENT_ID: 'abc',
    GOOGLE_CLIENT_SECRET: 'def'
  })
  const env = require('../env')
  expect(env.isProd).toBe(true)
  expect(env.projectRoot).toBe(path.resolve(__dirname, '..'))
  // expect(env.auth.cookie).toBe('cookie')
  // expect(env.auth.secret).toBe('secret')
  expect(env.workerCount).toBe(2)
})

test('verify env logic', () => {
  Object.assign(process.env, {
    NODE_ENV: 'production',
    AUTH: 'enabled',
    PORT: 8080,
    SECRET: 'secret',
    COOKIE: '',
    HOST: 'localhost',
    FACEBOOK_APP_ID: 'abc',
    FACEBOOK_APP_SECRET: 'def',
    GOOGLE_CLIENT_ID: 'abc',
    GOOGLE_CLIENT_SECRET: 'def'
  })
  const env = require('../env')
  expect(env.isProd).toBe(true)
  expect(env.projectRoot).toBe(path.resolve(__dirname, '..'))
  // expect(env.auth.cookie).toBe('jwt-token')
  // expect(env.auth.secret).toBe('secret')
  // expect(env.workerCount).toBe(4)
})
