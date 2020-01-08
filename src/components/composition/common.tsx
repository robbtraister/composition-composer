'use strict'

import React, { memo } from 'react'

import { Tree, TreeProps } from '../tree'

import compositionContext from '../../contexts/composition'

import { getDescendants } from '../utils'

export interface CompositionProps extends TreeProps {
  appName?: string
  appStyles?: string
  output?: string
  siteStyles?: string
  template?: string
}

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
