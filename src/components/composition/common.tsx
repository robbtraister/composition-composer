'use strict'

import React, { memo } from 'react'

import { Tree } from '../tree'

import compositionContext from '../../contexts/composition'

import { getDescendants } from '../utils'

export const Common = memo(function Common({
  children,
  value
}: {
  children?: React.ReactNode
  value: CompositionProps
}) {
  return (
    <compositionContext.Provider
      value={{
        cache: {},
        ...value,
        elements: getDescendants({ children: value.tree })
      }}>
      {children || <Tree />}
    </compositionContext.Provider>
  )
})
