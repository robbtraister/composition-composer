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
  quarantine?: boolean
  siteStyles?: string
  template?: string
  tree?: TreeNode

  getComponent?: (type: string) => React.ComponentType
  getContent?: (cp: ContentParams) => ContentResult
  getResource?: (name: string, encoding?: string) => any
}>({
  getComponent: () => React.Fragment,
  getContent: () => null,
  getResource: () => null
})

export function useCompositionContext() {
  const {
    cache,
    quarantine,
    getComponent,
    getContent,
    getResource,
    ...consumableContext
  } = useContext(compositionContext)
  return consumableContext
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
