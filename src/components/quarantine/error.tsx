'use strict'

import React from 'react'

import { useComponentContext } from '../../contexts/component'

export function RenderError(props: { error }) {
  const { id, type } = useComponentContext()
  const { error = {} } = props
  return (
    <div
      data-error-component={type}
      data-error-id={id}
      data-error-message={error.message || error}
    />
  )
}

export default RenderError
