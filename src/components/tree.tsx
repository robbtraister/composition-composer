'use strict'

import React, { memo, useContext } from 'react'

import { isClient } from './utils'
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

  getComponent?: (type: string) => React.ComponentType
  getContent?: (ContentConfig) => object
}

const QuarantineFragment = ({ children }: TreeNode) => <>{children}</>

export const Tree = memo(function Tree(treeProps: TreeProps) {
  const context = useContext(compositionContext)

  const tree = treeProps.tree || context.tree
  const getComponent = treeProps.getComponent || context.getComponent
  const getContent =
    treeProps.getContent || context.getContent || (() => Promise.resolve(null))

  if (tree && !getComponent) {
    throw new Error('Use of `tree` requires `getComponent` function')
  }

  const cache = treeProps.cache || {}

  const quarantine =
    isClient ||
    (Object.prototype.hasOwnProperty.call(treeProps, 'quarantine')
      ? treeProps.quarantine
      : context.quarantine)

  const Quarantine = quarantine ? QuarantineComponent : QuarantineFragment

  function getCachedContent(contentParams: ContentParams): ContentPromise {
    const { source, query } = contentParams
    const key = JSON.stringify({ content: { source, query } })
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
    const { props = {}, children = [], type } = node
    const Component = getComponent(type)

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
})

export default Tree
