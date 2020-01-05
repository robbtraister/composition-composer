'use strict'

import { promises as fsPromises } from 'fs'
import path from 'path'

import { decodeHTML } from 'entities'
import React from 'react'
import ReactDOM from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'

import { Composition } from '../../components'

import compile from '../compile'

import { Redirect } from '../errors'
import { fileExists } from '../utils/promises'

import components from '~/build/generated/components'

import { fetch } from '../content'

function getComponent(node) {
  return components[node.collection][node.type]
}

const StyledComponents = 'composition:styled-components'
const STYLED_COMPONENTS_PATTERN = new RegExp(
  `<${StyledComponents}></${StyledComponents}>`,
  'g'
)

async function getJson(filePath) {
  return JSON.parse((await fsPromises.readFile(filePath)).toString())
}

async function getHash(template, options) {
  const { styleHash } = await getJson(
    path.join(options.projectRoot, `build/dist/templates/${template}.css.json`)
  )

  return styleHash
}

async function getTree(template, options) {
  return getJson(
    path.join(options.projectRoot, 'templates', `${template}.json`)
  )
}

interface RenderOptions {
  quarantine?: boolean
}

export default async function render(props, options) {
  const { output = 'default', template } = props
  const { projectRoot } = options

  if (
    !(await fileExists(
      path.join(projectRoot, `build/dist/templates/${template}.js`)
    ))
  ) {
    await compile(template, options)
  }

  const styleHash = await getHash(template, options)
  const tree = await getTree(template, options)

  const Output = getComponent({
    collection: 'outputs',
    type: output
  })

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
              appName={`templates/${template}`}
              appStyles={`styles/templates/${styleHash}`}
              cache={cache}
              getComponent={getComponent}
              getContent={getContent}
              location={props.location}
              routerContext={context}
              siteStyles={`styles/outputs/${output}`}
              projectRoot={projectRoot}
              tree={tree}>
              <Output />
            </Composition>
          )
        )
        if (context && context.url) {
          throw new Redirect(context.url)
        }

        const result = html.replace(
          STYLED_COMPONENTS_PATTERN,
          sheet.getStyleTags()
        )

        return /\w*<\w*html[\w>]/i.test(result)
          ? // is a full html document
            `<!DOCTYPE html>${result}`
          : /\w*</i.test(result)
          ? // is an HTML/XML document
            result
          : // is not an HTML/XML document
            decodeHTML(result)
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
