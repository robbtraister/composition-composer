'use strict'

import { Router } from 'express'

import { ControllerType } from '../controller'

const qRE = /^([^;]+)(?:;\s*q=([01]\.?\d*))?/
function parseOutput(value = '') {
  return value
    .split(/,/g)
    .map(entry => {
      const match = qRE.exec(entry)
      return match && { value: match[1].trim(), q: Number(match[2]) || 1 }
    })
    .filter(m => m)
    .sort((a, b) => b.q - a.q)
    .map(({ value }) => value)
}

export default function router(controller: ControllerType) {
  const router = Router()

  router.get('*', async (req, res, next) => {
    try {
      const uri = req.originalUrl
      const output = [
        ...parseOutput(req.query.output),
        ...parseOutput(req.get('Accept'))
      ]
      const { body, contentType } = await controller.render(
        await controller.resolve({ uri, output })
      )
      res.set('Content-Type', contentType).send(body)
    } catch (error) {
      next(error)
    }
  })

  return router
}
