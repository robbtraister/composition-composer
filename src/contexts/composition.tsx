'use strict'

import React, { createContext, useContext } from 'react'

import { TreeNode } from '../components/tree'

export const compositionContext = createContext<{
  appName?: string
  appStyles?: string
  cache?: object
  elements?: TreeNode[]
  output?: string
  pageContent?: object
  projectRoot?: string
  quarantine?: boolean
  siteStyles?: string
  template?: string
  tree?: TreeNode

  getComponent?: (node) => React.ComponentType
  getContent?: (cp: ContentParams) => ContentResult
}>({
  getComponent: () => React.Fragment,
  getContent: () => null
})

export function useCompositionContext() {
  const {
    cache,
    projectRoot,
    quarantine,
    ...consumableAppContext
  } = useContext(compositionContext)
  return consumableAppContext
}

export function CompositionContext(props) {
  const { component: Component, render } = props
  const context = useCompositionContext()

  if (Component) {
    return <Component context={context} />
  } else if (render) {
    return render({ context })
  }
}

export default compositionContext
