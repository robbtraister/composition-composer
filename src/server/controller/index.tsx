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

import components from '~/../build/generated/components'
import formats from '~/../build/generated/formats'
import resolverConfigs from '~/resolvers.json'
import Resolver from './resolver'

const debug = debugModule('composition:controller')

const DEFAULT_FORMAT = 'html'

const formatMap = {}
// set `index` as the default for `text/html`; can be overridden below
if (DEFAULT_FORMAT in formats && !formats[DEFAULT_FORMAT].contentType) {
  formatMap['text/html'] = DEFAULT_FORMAT
}
Object.keys(formats).forEach(format => {
  formatMap[format] = format
  const { contentType } = formats[format]
  if (contentType) {
    formatMap[contentType.toLowerCase()] = format
  }
})
const resolvers = []
  .concat(resolverConfigs || [])
  .map(resolver => new Resolver(resolver))

export type ControllerType = Controller & Composition.Options

function getComponent(format, type) {
  return components[type][format]
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

function wrapResult(result, context, Format) {
  const body = Format.transform ? Format.transform(result, context) : result

  const contentType = Format.contentType
    ? `${Format.contentType}`.toLowerCase()
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

  async compileTemplate({ template, format, tree = null }) {
    const start = Date.now()

    try {
      tree = tree || (await this.getTemplate(template)).tree
      const components = getDescendants({ children: tree }).map(
        ({ type }) => type
      )

      const result = await this.compile({
        components,
        name: `templates/${template}`,
        format,
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

  async getHash({ template, format, tree = null }) {
    const getStyleHash = async () => {
      const { styleHash } = JSON.parse(
        await this.readAssetFile(
          path.join('templates', template, `${format}.css.json`)
        )
      )
      return styleHash
    }

    try {
      return await getStyleHash()
    } catch (_) {
      await this.compileTemplate({ template, format, tree })
      return getStyleHash()
    }
  }

  async render(props) {
    const { meta, format, styleHash, template, title, tree, uri } = props

    const Format = formats[format]

    const cache = {}

    const context = {
      appName: `templates/${template}/${format}`,
      appStyles: `styles/templates/${styleHash}`,
      cache,
      getComponent: getComponent.bind(null, format),
      getContent: this.fetch.bind(this),
      getResource: this.readResourceFile.bind(this),
      format,
      formatStyles: `styles/formats/${format}`,
      location: uri,
      meta,
      title,
      template,
      tree
    }

    const renderSync = quarantine => {
      const sheet = new ServerStyleSheet()
      try {
        const routerContext: { url?: string } = {}
        const html = ReactDOM.renderToStaticMarkup(
          sheet.collectStyles(
            <Page
              {...context}
              quarantine={quarantine}
              routerContext={routerContext}>
              <Format>
                <Tree />
              </Format>
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

    const renderAsync = async (quarantine = false) => {
      let result = renderSync(quarantine)
      const promises = Object.values(cache)
      if (promises.length > 0) {
        await Promise.all(promises)
        result = renderSync(quarantine)
      }
      return result
    }

    let result
    try {
      result = await renderAsync()
    } catch (error) {
      result = await renderAsync(true)
    }

    return wrapResult(result, context, Format)
  }

  async resolve({ uri, format }: { uri: string; format: string | string[] }) {
    debug('resolving', { uri, format })
    const url = new URL(uri, 'http://a.com')
    const { template: templateName, ...config } = await this.resolveUri(
      url.pathname
    )
    const template = await this.getTemplate(templateName)

    const formatKey =
      [].concat(format || []).find(format => formatMap[format]) ||
      DEFAULT_FORMAT

    const selectedFormat = formatMap[formatKey]

    const result = {
      meta: {
        charset: 'UTF-8',
        viewport: 'width=device-width'
      },
      title: `Template: ${templateName}`,
      template: templateName,
      ...config,
      ...template,
      format: selectedFormat,
      styleHash: await this.getHash({
        template: templateName,
        format: selectedFormat,
        tree: template.tree
      }),
      uri
    }
    debug('resolved', result)
    return result
  }
}

export default Controller
