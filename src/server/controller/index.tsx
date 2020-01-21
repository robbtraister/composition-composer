'use strict'

import path from 'path'
import { URL } from 'url'

import debugModule from 'debug'
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
import resolverConfigs from '~/resolvers.json'
import Resolver from './resolver'

const debug = debugModule('composition:controller')

const outputMap = {}
Object.keys(outputs).forEach(output => {
  outputMap[output] = output
  const { contentType } = outputs[output]
  if (contentType) {
    outputMap[contentType] = output
  }
})
const resolvers = []
  .concat(resolverConfigs || [])
  .map(resolver => new Resolver(resolver))

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

async function getTemplateFromDB(template) {
  return this.db.getModel('templates').get(template)
}

async function getTemplateFromFS(template) {
  return import(`~/templates/${template}.json`)
}

async function resolveFromDB(uri) {
  const { resolvers } = await this.db
    .getModel('resolvers')
    .get('__ALL_RESOLVERS__')

  let match
  resolvers.find(resolver => {
    match = new Resolver(resolver).match(uri)
    return match
  })
  return match
}

async function resolveFromFS(uri) {
  let match
  resolvers.find(resolver => {
    match = resolver.match(uri)
    return match
  })

  return match
}

class Controller extends Environment {
  db: Composition.DB

  getTemplate: (string) => Promise<{ tree?: object }>
  resolveUri: (string) => Promise<{ template: string }>

  constructor(options: Composition.Options = {}) {
    super(options)

    this.db = this.mongoUrl ? Mongo(this.mongoUrl) : null
    this.getTemplate = this.db ? getTemplateFromDB : getTemplateFromFS
    this.resolveUri = this.db ? resolveFromDB : resolveFromFS
  }

  async compileTemplate({ template, output, tree = null }) {
    const start = Date.now()

    try {
      tree = tree || (await this.getTemplate(template)).tree
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

  // don't mark as async, as that will force-wrap with a new Promise
  /* async */ fetch({ source, query }: Composition.ContentParams) {
    return getContentSource(source).fetch(query)
  }

  /* async */ update({ source, query }: Composition.ContentParams) {
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
    const { meta, output, styleHash, template, title, tree, uri } = props

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
      meta,
      output,
      outputStyles: `styles/outputs/${output}`,
      title,
      template,
      tree
    }

    const renderSync = () => {
      const sheet = new ServerStyleSheet()
      try {
        const routerContext: { url?: string } = {}
        const html = ReactDOM.renderToStaticMarkup(
          sheet.collectStyles(
            <Page {...context} routerContext={routerContext}>
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

    return wrapResult(result, context, Output)
  }

  async resolve({ uri, output }: { uri: string; output: string | string[] }) {
    debug('resolving', { uri, output })
    const url = new URL(uri, 'http://a.com')
    const { template: templateName, ...config } = await this.resolveUri(
      url.pathname
    )
    const template = await this.getTemplate(templateName)

    const outputKey =
      [].concat(output || []).find(output => outputMap[output]) || 'default'

    const selectedOutput = outputMap[outputKey]

    const result = {
      meta: {
        charset: 'UTF-8',
        viewport: 'width=device-width'
      },
      title: `Template: ${templateName}`,
      template: templateName,
      ...config,
      ...template,
      output: selectedOutput,
      styleHash: await this.getHash({
        template: templateName,
        output: selectedOutput,
        tree: template.tree
      }),
      uri
    }
    debug('resolved', result)
    return result
  }
}

export default Controller
