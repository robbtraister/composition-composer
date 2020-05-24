'use strict'

import debugModule from 'debug'
import React, { memo } from 'react'

import { Tree } from '../tree'
import { getDescendants } from '../utils'

import rootContext from '../../contexts/root'

const debug = debugModule('composition:components:context')

export const CommonRoot = memo(function CommonRoot({
  children,
  value
}: {
  children?: React.ReactNode
  value: Composition.RootProps
}) {
  const context = {
    ...value,
    cache: value.cache || {},
    elements: getDescendants({ children: value.tree })
  }
  debug('rendering with context', context)
  return (
    <rootContext.Provider value={context}>
      {children || <Tree />}
    </rootContext.Provider>
  )
})
