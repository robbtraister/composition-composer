'use strict'

import path from 'path'

import { decodeHTML } from 'entities'
import React from 'react'
import ReactDOM from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'

import { Composition, Tree } from '../../components'

import compile from '../../utils/compile'

import { Redirect } from '../errors'
import { fileExists } from '../../utils/promises'

import components from '~/../build/generated/components'
import outputs from '~/../build/generated/outputs'

import { fetch } from '../content'

function getComponent(output, node) {
  return components[node.type][output]
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

const StyledComponents = 'composition:styled-components'
const STYLED_COMPONENTS_PATTERN = new RegExp(
  `<${StyledComponents}></${StyledComponents}>`,
  'g'
)

interface RenderOptions {
  quarantine?: boolean
}

export default async function render(props, options) {
  const { output, styleHash, template, tree, uri } = props
  const { projectRoot } = options

  if (
    !(await fileExists(
      path.join(projectRoot, `build/dist/templates/${template}/${output}.js`)
    ))
  ) {
    await compile({ template, output }, options)
  }

  const Output = outputs[output]

  const cache = {}
  async function renderAsync(renderOptions: RenderOptions = {}) {
    function getContent({ source, query }: ContentParams) {
      const key = JSON.stringify({ content: { source, query } })
      if (key in cache) {
        return cache[key]
      }

      cache[key] = fetch({ source, query })
        .then(data => {
          cache[key] = data
          return data
        })
        .catch(() => {
          cache[key] = null
        })

      return null
    }

    function renderSync() {
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
              getContent={getContent}
              location={uri}
              output={output}
              routerContext={context}
              siteStyles={`styles/outputs/${output}`}
              projectRoot={projectRoot}
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

        const body = html.replace(
          STYLED_COMPONENTS_PATTERN,
          sheet.getStyleTags()
        )

        const contentType = getContentType(Output, body)

        return {
          body: !/^text\/html(;|$)/i.test(contentType)
            ? // is not an HTML document
              decodeHTML(body)
            : /\w*<\w*html[\w>]/i.test(body)
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
