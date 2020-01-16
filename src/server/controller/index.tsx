'use strict'

import path from 'path'
import { URL } from 'url'

import { decodeHTML } from 'entities'
import React from 'react'
import ReactDOM from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'

import { getContentSource } from './content'
import { Mongo } from './mongo'

import { Redirect } from '../errors'

import { Page, StyledComponents, Tree } from '../../components'
import { getDescendants } from '../../components/utils'

import Environment from '../../utils/environment'
import logger from '../../utils/logger'
import { fileExists } from '../../utils/promises'

import components from '~/../build/generated/components'
import outputs from '~/../build/generated/outputs'

export type ControllerType = Controller & Composition.Options

function getComponent(output, type) {
  return components[type][output]
}

function getContentType(body) {
  return typeof body === 'string'
    ? /\w*</i.test(body)
      ? // is an HTML/XML document
        'text/html'
      : // is not an HTML/XML document
        'text/plain'
    : 'application/json'
}

function wrapResult(result, context, Output) {
  const body = Output.transform ? Output.transform(result, context) : result

  const contentType = Output.contentType
    ? `${Output.contentType}`.toLowerCase()
    : getContentType(body)

  return {
    body: !/^text\/html(;|$)/i.test(contentType)
      ? // is not an HTML document
        typeof body === 'string'
        ? decodeHTML(body)
        : body
      : /\s*<\s*html[\s>]/i.test(body)
      ? // is a full HTML document
        `<!DOCTYPE html>${body}`
      : // is an HTML snippet
        body,
    contentType
  }
}

const STYLED_COMPONENTS_PATTERN = new RegExp(
  `<${StyledComponents}></${StyledComponents}>`,
  'g'
)

interface RenderOptions {
  quarantine?: boolean
}

async function getTreeFromDB(template) {
  return this.db.getModel('templates').get(template)
}

async function getTreeFromFS(template) {
  return JSON.parse(
    await this.readResourceFile(path.join('templates', `${template}.json`))
  )
}

class Controller extends Environment {
  getTree: Function
  db: Composition.DB

  constructor(options: Composition.Options = {}) {
    super(options)

    this.db = this.mongoUrl ? Mongo(this.mongoUrl) : null
    this.getTree = this.db ? getTreeFromDB : getTreeFromFS
  }

  async compileTemplate({ template, output, tree = null }) {
    const start = Date.now()

    try {
      tree = tree || (await this.getTree(template))
      const components = getDescendants({ children: tree }).map(
        ({ type }) => type
      )

      const result = await this.compile({
        components,
        name: `templates/${template}`,
        output,
        template,
        tree
      })

      logger.info(`${template} compiled in ${(Date.now() - start) / 1000}s`)

      return result
    } catch (error) {
      console.error(error)
    }
  }

  async clear({ source, query }: Composition.ContentParams) {
    return getContentSource(source).clear(query)
  }

  async fetch({ source, query }: Composition.ContentParams) {
    return getContentSource(source).fetch(query)
  }

  async update({ source, query }: Composition.ContentParams) {
    return getContentSource(source).update(query)
  }

  async getHash({ template, output, tree = null }) {
    if (
      !(await fileExists(
        this.getAssetFile(
          path.join('templates', template, `${output}.css.json`)
        )
      ))
    ) {
      await this.compileTemplate({ template, output, tree })
    }

    const { styleHash } = JSON.parse(
      await this.readAssetFile(
        path.join('templates', template, `${output}.css.json`)
      )
    )
    return styleHash
  }

  async render(props) {
    const { output, styleHash, template, tree, uri } = props

    const Output = outputs[output]

    const cache = {}

    const context = {
      appName: `templates/${template}/${output}`,
      appStyles: `styles/templates/${styleHash}`,
      cache,
      getComponent: getComponent.bind(null, output),
      getContent: this.fetch.bind(this),
      getResource: this.readResourceFile.bind(this),
      location: uri,
      output,
      outputStyles: `styles/outputs/${output}`,
      template,
      tree
    }

    const renderAsync = async (renderOptions: RenderOptions = {}) => {
      const renderSync = () => {
        const sheet = new ServerStyleSheet()
        try {
          const routerContext: { url?: string } = {}
          const html = ReactDOM.renderToStaticMarkup(
            sheet.collectStyles(
              <Page
                {...renderOptions}
                {...context}
                routerContext={routerContext}>
                <Output>
                  <Tree />
                </Output>
              </Page>
            )
          )
          if (routerContext && routerContext.url) {
            throw new Redirect(routerContext.url)
          }

          return (
            html
              .replace(
                STYLED_COMPONENTS_PATTERN,
                sheet.getStyleTags().replace(/<\/?style[^>]*>/g, '')
              )
              // remove empty, orphaned style tag if styled-components is not used
              .replace(/<style><\/style>/g, '')
          )
        } finally {
          sheet.seal()
        }
      }

      let result = renderSync()
      const promises = Object.values(cache)
      if (promises.length > 0) {
        await Promise.all(promises)
        result = renderSync()
      }
      return result
    }

    let result
    try {
      result = await renderAsync()
    } catch (error) {
      console.error(error)
      result = renderAsync({ quarantine: true })
    }
    return wrapResult(result, context, Output)
  }

  async resolve({ uri, output = 'default' }) {
    const url = new URL(uri, 'http://a.com')
    const template = url.pathname === '/' ? 'homepage' : 'article'
    const tree = await this.getTree(template)

    return {
      meta: {
        charset: 'UTF-8',
        viewport: 'width=device-width'
      },
      output,
      styleHash: await this.getHash({ template, output, tree }),
      title: `Template: ${template}`,
      template,
      tree,
      uri
    }
  }
}

export default Controller
