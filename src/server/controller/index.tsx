'use strict'

import path from 'path'
import { URL } from 'url'

import { decodeHTML } from 'entities'
import React from 'react'
import ReactDOM from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'

import { getContentSource } from './content'

import { Redirect } from '../errors'

import { Composition, StyledComponents, Tree } from '../../components'
import { getDescendants } from '../../components/utils'

import Environment from '../../utils/environment'
import logger from '../../utils/logger'
import { fileExists } from '../../utils/promises'

import components from '~/../build/generated/components'
import outputs from '~/../build/generated/outputs'

export type ControllerType = Controller & Options

function getComponent(output, type) {
  return components[type][output]
}

function getContentType(Output, body) {
  if (Output.contentType) {
    return `${Output.contentType}`.toLowerCase()
  }

  return /\w*</i.test(body)
    ? // is an HTML/XML document
      'text/html'
    : // is not an HTML/XML document
      'text/plain'
}

const STYLED_COMPONENTS_PATTERN = new RegExp(
  `<${StyledComponents}></${StyledComponents}>`,
  'g'
)

interface RenderOptions {
  quarantine?: boolean
}

class Controller extends Environment {
  async compileTemplate({ template, output }) {
    const start = Date.now()

    try {
      const tree = await this.getTree(template)
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

  async clear({ source, query }: ContentParams) {
    return getContentSource(source).clear(query)
  }

  async fetch({ source, query }: ContentParams) {
    return getContentSource(source).fetch(query)
  }

  async update({ source, query }: ContentParams) {
    return getContentSource(source).update(query)
  }

  async getHash({ template, output }) {
    if (
      !(await fileExists(
        this.getAssetFile(
          path.join('templates', template, `${output}.css.json`)
        )
      ))
    ) {
      await this.compileTemplate({ template, output })
    }

    const { styleHash } = JSON.parse(
      await this.readAssetFile(
        path.join('templates', template, `${output}.css.json`)
      )
    )
    return styleHash
  }

  async getTree(template) {
    return require(`~/../templates/${template}.json`)
    // return JSON.parse(
    //   await this.readResourceFile(path.join('templates', `${template}.json`))
    // )
  }

  async render(props) {
    const { output, styleHash, template, tree, uri } = props

    const Output = outputs[output]

    const cache = {}

    const renderAsync = async (renderOptions: RenderOptions = {}) => {
      const renderSync = () => {
        const sheet = new ServerStyleSheet()
        try {
          const context: { url?: string } = {}
          const html = ReactDOM.renderToStaticMarkup(
            sheet.collectStyles(
              <Composition
                {...renderOptions}
                appName={`templates/${template}/${output}`}
                appStyles={`styles/templates/${styleHash}`}
                cache={cache}
                getComponent={getComponent.bind(null, output)}
                getContent={this.fetch.bind(this)}
                getResource={this.readResourceFile.bind(this)}
                location={uri}
                output={output}
                routerContext={context}
                outputStyles={`styles/outputs/${output}`}
                template={template}
                tree={tree}>
                <Output>
                  <Tree />
                </Output>
              </Composition>
            )
          )
          if (context && context.url) {
            throw new Redirect(context.url)
          }

          const body = html
            .replace(
              STYLED_COMPONENTS_PATTERN,
              sheet.getStyleTags().replace(/<\/?style[^>]*>/g, '')
            )
            // remove empty, orphaned style tag if styled-components is not used
            .replace(/<style><\/style>/g, '')

          const contentType = getContentType(Output, body)

          return {
            body: !/^text\/html(;|$)/i.test(contentType)
              ? // is not an HTML document
                decodeHTML(body)
              : /\s*<\s*html[\s>]/i.test(body)
              ? // is a full HTML document
                `<!DOCTYPE html>${body}`
              : // is an HTML snippet
                body,
            contentType
          }
        } finally {
          sheet.seal()
        }
      }

      let html = renderSync()
      const promises = Object.values(cache)
      if (promises.length > 0) {
        await Promise.all(promises)
        html = renderSync()
      }
      return html
    }

    try {
      return await renderAsync()
    } catch (error) {
      console.error(error)
      return renderAsync({ quarantine: true })
    }
  }

  async resolve({ uri, output = 'default' }) {
    const url = new URL(uri, 'http://a.com')
    const template = url.pathname === '/' ? 'homepage' : 'article'

    return {
      output,
      styleHash: await this.getHash({ template, output }),
      template,
      tree: await this.getTree(template),
      uri
    }
  }
}

export default Controller
