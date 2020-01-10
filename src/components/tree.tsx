'use strict'

import React, { memo, useContext } from 'react'

import { isClient } from './utils'
import QuarantineComponent from './quarantine'
import componentContext from '../contexts/component'

import compositionContext from '../contexts/composition'

const QuarantineFragment = ({ children }: TreeNode) => <>{children}</>

export const Tree = memo(function Tree(treeProps: TreeProps) {
  const context = useContext(compositionContext)

  const getComponent = treeProps.getComponent || context.getComponent
  const tree = treeProps.tree || context.tree

  if (tree && !getComponent) {
    throw new Error('Use of `tree` requires `getComponent` function')
  }

  const getContent =
    treeProps.getContent || context.getContent || (() => Promise.resolve(null))
  const quarantine =
    isClient ||
    (Object.prototype.hasOwnProperty.call(treeProps, 'quarantine')
      ? treeProps.quarantine
      : context.quarantine)

  const Quarantine = quarantine ? QuarantineComponent : QuarantineFragment

  function Node(node: TreeNode) {
    const { props = {}, children = [], type } = node
    const Component = getComponent(type)

    const componentContextValue = { ...node, getContent }

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
