'use strict'

import React from 'react'
import { StaticRouter } from 'react-router'

import { Common } from './common'

export function Composition(props: ServerCompositionProps) {
  const { children, location, routerContext = {}, ...contextValue } = props
  return (
    <StaticRouter location={location} context={routerContext}>
      <Common value={contextValue}>{children}</Common>
    </StaticRouter>
  )
}

export default Composition
