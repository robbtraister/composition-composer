'use strict'

/* global Composition */

import React from 'react'
import ReactDOM from 'react-dom'

import { Composition as CompositionComponent } from '../components'

import unpack from '../utils/unpack'

const componentCache = {}
function getComponent(type) {
  if (!(type in componentCache)) {
    componentCache[type] = unpack(Composition.components[type]) || type
  }
  return componentCache[type]
}

function getContent({ source, query }) {
  return window
    .fetch(
      `/api/content/fetch?source=${encodeURIComponent(
        source
      )}&query=${encodeURIComponent(query)}`
    )
    .then(res => res.json())
}

const resolutions = {}
async function resolve(uri) {
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
    ReactDOM[Composition.method || 'render'](
      <CompositionComponent
        getComponent={getComponent}
        getContent={getContent}
        cache={Composition.cache}
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
