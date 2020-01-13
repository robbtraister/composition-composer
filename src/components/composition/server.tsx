'use strict'

import React from 'react'
import { StaticRouter } from 'react-router'

import { Common } from './common'

export function Composition(props: Composition.ServerCompositionProps) {
  const { children, routerContext = {}, ...contextValue } = props
  return (
    <StaticRouter location={props.location} context={routerContext}>
      <Common value={contextValue}>{children}</Common>
    </StaticRouter>
  )
}

export default Composition
