'use strict'

import React, { useContext } from 'react'

import QuarantineComponent from './quarantine'
import componentContext from '../contexts/component'

import compositionContext from '../contexts/composition'

export interface ContentConfig {
  source: string
  query: object
}

export interface TreeNode {
  id: string
  type: string
  props?: object
  children?: object
}

export interface TreeProps {
  cache?: object
  pageContent?: object
  quarantine?: boolean
  tree?: TreeNode

  getComponent?: (TreeNode) => React.ComponentType
  getContent?: (ContentConfig) => object
}

export function Tree(treeProps: TreeProps) {
  const context = useContext(compositionContext)

  const tree = treeProps.tree || context.tree
  const getComponent = treeProps.getComponent || context.getComponent
  const getContent =
    treeProps.getContent || context.getContent || (() => Promise.resolve(null))

  if (tree && !getComponent) {
    throw new Error('Use of `tree` requires `getComponent` function')
  }

  const cache = treeProps.cache || {}

  const quarantine = Object.prototype.hasOwnProperty.call(
    treeProps,
    'quarantine'
  )
    ? treeProps.quarantine
    : context.quarantine

  const Quarantine = quarantine
    ? QuarantineComponent
    : ({ children }) => <>{children}</>

  const componentCache = {}
  function getCachedComponent(node: TreeNode) {
    const { type } = node
    if (!componentCache[type]) {
      componentCache[type] = getComponent(node)
    }
    return componentCache[type]
  }

  function getCachedContent(contentParams: ContentParams): ContentPromise {
    const { source, query, filter } = contentParams
    const key = JSON.stringify({ source, query, filter })
    if (!cache[key]) {
      const result: ContentResult = getContent(contentParams)

      const promise: ContentPromise =
        result instanceof Promise ? result : Promise.resolve(result)
      const cached = result instanceof Promise ? promise.cached : result

      const contentEntry: ContentPromise = promise.then(content => {
        contentEntry.cached = content
        return content
      })

      cache[key] = Object.assign(contentEntry, { cached })
    }
    return cache[key]
  }

  function Node(node: TreeNode) {
    const Component = getCachedComponent(node)
    const { props = {}, children = [] } = node

    const componentContextValue = { ...node, getContent: getCachedContent }

    return (
      <componentContext.Provider value={componentContextValue}>
        <Quarantine {...node}>
          <Component {...props}>
            {[].concat(children || []).map((child, index) => (
              <Node key={child.id || index} {...child} />
            ))}
          </Component>
        </Quarantine>
      </componentContext.Provider>
    )
  }

  return <Node {...tree} />
}

export default Tree
