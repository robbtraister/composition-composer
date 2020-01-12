'use strict'

import debugModule from 'debug'
import React from 'react'
import ReactDOM from 'react-dom/server'

import RenderError from './error'

const debug = debugModule('composition:components:quarantine')

export function Quarantine(node: TreeNode) {
  const { id, type, props, children } = node
  try {
    const element = <>{children}</>
    ReactDOM.renderToString(element)
    return element
  } catch (error) {
    debug('caught component error', { type, id, props, error })
    return <RenderError error={error} />
  }
}

export default Quarantine
