'use strict'

import React from 'react'
import ReactDOM from 'react-dom/server'

import RenderError from './error'

export function Quarantine({ children }: TreeNode) {
  try {
    const element = <>{children}</>
    ReactDOM.renderToString(element)
    return element
  } catch (error) {
    return <RenderError error={error} />
  }
}

export default Quarantine
