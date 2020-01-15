'use strict'

/* global test */

import assert from 'assert'

import request from 'supertest'

import app from '../src/server/app'

// test('hello', () => {
//   return request(app({ auth: null }))
//     .get('/')
//     .expect(200)
//     .then(res => {
//       assert.strictEqual(res.text, 'hello, world!')
//     })
// })

test('favicon', () => {
  return request(app())
    .get('/favicon.ico')
    .expect(404)
})

test('favicon', () => {
  return request(app({ projectRoot: null }))
    .get('/favicon.ico')
    .expect(404)
})

test('uri', () => {
  return request(app())
    .get('/api/uri')
    .expect(200)
    .expect('Content-Type', /^application\/json(;|$)/)
    .then(res => {
      assert.strictEqual(res.body.uri, '/api/uri')
    })
})

test('logging 400', () => {
  return request(app({ logLevel: 'info' }))
    .get('/api/error/400')
    .expect(400)
})

test('logging 500', () => {
  return request(app({ logLevel: 'info' }))
    .get('/api/error')
    .expect(500)
})

test('production 400', () => {
  return request(app({ isProd: true }))
    .get('/api/error/400')
    .expect(400)
})

test('production 500', () => {
  return request(app({ isProd: true }))
    .get('/api/error')
    .expect(500)
})

// test('csrf', () => {
//   return request(app({ auth: null }))
//     .get('/api/csrf')
//     .expect(200)
//     .expect('Content-Type', /^application\/json(;|$)/)
//     .then(res => {
//       const csrfToken = res.body.csrf
//       const csrfCookie = res.header['set-cookie']
//         .shift()
//         .split(';')
//         .shift()

//       assert.strictEqual(typeof csrfToken, 'string')

//       return request(app({ auth: null }))
//         .post(`/api/restart?_csrf=${csrfToken}`)
//         .set('Cookie', csrfCookie)
//         .expect(500)
//     })
// })

// test('unauthorized', () => {
//   return request(
//     app({
//       auth: {
//         secret: 'secret',
//         providers: { google: { clientID: 'abc', clientSecret: 'def' } }
//       }
//     })
//   )
//     .get('/api/uri')
//     .expect(401)
// })

// test('google', () => {
//   return request(
//     app({
//       auth: {
//         secret: 'secret',
//         providers: { google: { clientID: 'abc', clientSecret: 'def' } }
//       }
//     })
//   )
//     .get('/auth/google')
//     .expect(302)
// })

// test('logout', () => {
//   return request(
//     app({
//       auth: {
//         secret: 'secret',
//         providers: { google: { clientID: 'abc', clientSecret: 'def' } }
//       }
//     })
//   )
//     .get('/auth/logout')
//     .expect(302)
// })
