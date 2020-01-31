'use strict'

import fs from 'fs'
import path from 'path'

import express from 'express'

import { ControllerType } from '../controller'

export default function router(controller: ControllerType) {
  const publicRoot = path.resolve(controller.projectRoot || '.', 'public')

  const assetRouter = express()

  assetRouter.all(
    '/favicon.ico',
    express.static(publicRoot),
    (req, res, next) => {
      res.sendStatus(404)
    }
  )

  assetRouter.use(
    '/dist',
    express.static(path.resolve(controller.projectRoot || '.', 'build', 'dist'))
  )

  assetRouter.all(
    '/dist/templates/:template/:format.(css|js)',
    async (req, res, next) => {
      const template = req.params.template
      const format = req.params.format
      const ext = req.params[0]
      await controller.compileTemplate({ template, format })
      try {
        fs.createReadStream(
          path.join(
            controller.projectRoot,
            'build',
            'dist',
            'templates',
            template,
            `${format}.${ext}`
          )
        ).pipe(res)
      } catch (e) {
        console.error(e)
        res.sendStatus(500)
      }
    }
  )

  assetRouter.use('/dist', (req, res, next) => {
    res.sendStatus(404)
  })

  assetRouter.all(/\.[^/]+$/, express.static(publicRoot))

  return assetRouter
}
