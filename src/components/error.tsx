'use strict'

import debugModule from 'debug'
import React from 'react'

import { useComponentContext } from '../contexts/component'

const debug = debugModule('composition:components:error')

export function RenderError({ error = {} }: { error? }) {
  const { id, type, props } = useComponentContext()
  debug('caught component error', { type, id, props, error })
  return (
    <div
      data-error-component={type}
      data-error-id={id}
      data-error-message={error.message || error}
      style={{ display: 'none' }}
    />
  )
}

export default RenderError
