'use strict'

import debugModule from 'debug'
import React, { memo } from 'react'

import { Tree } from '../tree'
import { getDescendants } from '../utils'

import pageContext from '../../contexts/page'

const debug = debugModule('composition:components:context')

export const CommonPage = memo(function CommonPage({
  children,
  value
}: {
  children?: React.ReactNode
  value: Composition.PageProps
}) {
  const context = {
    cache: {},
    ...value,
    elements: getDescendants({ children: value.tree })
  }
  debug('rendering with context', context)
  return (
    <pageContext.Provider value={context}>
      {children || <Tree />}
    </pageContext.Provider>
  )
})
