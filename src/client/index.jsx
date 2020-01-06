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

function getContent({ source, query }) {
  const cached =
    Composition.cache[JSON.stringify({ content: { source, query } })]

  const result = cached
    ? Promise.resolve(cached)
    : window
        .fetch(
          `/api/content/fetch?source=${encodeURIComponent(
            source
          )}&query=${encodeURIComponent(query)}`
        )
        .then(res => res.json())

  result.cached = cached

  return result
}

async function resolve(location) {
  return window
    .fetch(
      `/api/resolve?uri=${encodeURIComponent(
        location.pathname + location.search
      )}`
    )
    .then(res => res.json())
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
