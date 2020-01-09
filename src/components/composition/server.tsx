'use strict'

import React from 'react'
import { StaticRouter } from 'react-router'

import { Common, CompositionProps } from './common'

interface ServerCompositionProps extends CompositionProps {
  children?: React.ReactNode
  location?: string
  routerContext?: { url?: string }
}

export function Composition(props: ServerCompositionProps) {
  const { children, location, routerContext = {}, ...contextValue } = props
  return (
    <StaticRouter location={location} context={routerContext}>
      <Common value={contextValue}>{children}</Common>
    </StaticRouter>
  )
}

export default Composition
