'use strict'

/* global Composition */

import React from 'react'
import ReactDOM from 'react-dom'

import { Composition as CompositionComponent } from '../components'

import unpack from '../utils/unpack'

function getComponent(node) {
  const Component = unpack(Composition.components[node.type]) || node.type

  return Component
}

const contentFetches = {}
function getContent({ source, query }) {
  const cacheKey = JSON.stringify({ content: { source, query } })
  if (!(cacheKey in contentFetches)) {
    const cached = Composition.cache[cacheKey]

    const promise = cached
      ? Promise.resolve(cached)
      : window
          .fetch(
            `/api/content/fetch?source=${encodeURIComponent(
              source
            )}&query=${encodeURIComponent(query)}`
          )
          .then(res => res.json())
          .then(data => {
            promise.cached = data
            return data
          })

    promise.cached = cached

    contentFetches[cacheKey] = promise
  }
  return contentFetches[cacheKey]
}

const resolutions = {}
async function resolve(location) {
  const uri = location.pathname + location.search
  if (!(uri in resolutions)) {
    resolutions[uri] = window
      .fetch(`/api/resolve?uri=${encodeURIComponent(uri)}`)
      .then(res => res.json())
  }
  return resolutions[uri]
}

function render() {
  if (!Composition.tree) return

  const renderElement = window.document.getElementById('composition-app')
  if (!renderElement) return

  const serverHtml = renderElement.innerHTML

  const styleElement = window.document.getElementById('composition-app-styles')
  const serverStyleHref = styleElement && styleElement.href
  if (styleElement) {
    styleElement.href = `/dist/styles/templates/${Composition.styleHash}.css`
  }

  try {
    ReactDOM.render(
      <CompositionComponent
        getComponent={getComponent}
        getContent={getContent}
        output={Composition.output}
        resolve={resolve}
        single-page={Composition.singlePage}
        template={Composition.template}
        tree={Composition.tree}
      />,
      renderElement
    )
  } catch (e) {
    console.error(e)
    if (styleElement) {
      styleElement.href = serverStyleHref
    }
    renderElement.innerHTML = serverHtml
  }
}

window.document.addEventListener('DOMContentLoaded', render)
