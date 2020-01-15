'use strict'

import React from 'react'
import { StaticRouter } from 'react-router'

import { CommonPage } from './common'

export function Page(props: Composition.ServerPageProps) {
  const { children, routerContext = {}, ...contextValue } = props
  return (
    <StaticRouter location={props.location} context={routerContext}>
      <CommonPage value={contextValue}>{children}</CommonPage>
    </StaticRouter>
  )
}

export default Page
