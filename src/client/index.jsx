'use strict'

/* global Composition */

import React from 'react'
import ReactDOM from 'react-dom'

import { Page } from '../components'

import unpack from '../utils/unpack'

function getComponent(type) {
  return unpack(Composition.components[type]) || type
}

function getContent({ source, query }) {
  const contentPromise = window
    .fetch(
      `/api/content/fetch?source=${encodeURIComponent(
        source
      )}&query=${encodeURIComponent(JSON.stringify(query))}`
    )
    .then(res => {
      const expires = res.headers.get('expires')
      contentPromise.expires = expires && +new Date(expires)
      return res.json()
    })
    .then(value => {
      contentPromise.value = value
      return value
    })
  return contentPromise
}

const resolutions = {}
async function resolve(uri) {
  if (!(uri in resolutions)) {
    resolutions[uri] = window
      .fetch(
        `/api/resolve?uri=${encodeURIComponent(
          uri
        )}&output=${encodeURIComponent(Composition.output)}`
      )
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
      <Page
        getComponent={getComponent}
        getContent={getContent}
        cache={Composition.cache}
        location={
          window.location.pathname +
          window.location.search +
          window.location.hash
        }
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
