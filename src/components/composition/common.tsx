'use strict'

import debugModule from 'debug'
import React, { memo } from 'react'

import { Tree } from '../tree'

import compositionContext from '../../contexts/composition'

import { getDescendants } from '../utils'

const debug = debugModule('composition:components:context')

export const Common = memo(function Common({
  children,
  value
}: {
  children?: React.ReactNode
  value: Composition.CompositionProps
}) {
  const context = {
    cache: {},
    ...value,
    elements: getDescendants({ children: value.tree })
  }
  debug('rendering with context', context)
  return (
    <compositionContext.Provider value={context}>
      {children || <Tree />}
    </compositionContext.Provider>
  )
})
