'use strict'

import debugModule from 'debug'
import React, { memo, useContext, useState } from 'react'

import QuarantineComponent from './quarantine'
import { withTimer } from './timer'
import { isClient } from './utils'
import componentContext from '../contexts/component'

import compositionContext from '../contexts/composition'

const debug = debugModule('composition:components:tree')

const QuarantineFragment = ({ children }: Composition.TreeNode) => (
  <>{children}</>
)

export const Tree = memo(function Tree(treeProps: Composition.TreeProps) {
  const [componentCache] = useState({})
  const context = useContext(compositionContext)

  const getComponent = treeProps.getComponent || context.getComponent
  const tree = treeProps.tree || context.tree

  if (tree && !getComponent) {
    throw new Error('Use of `tree` requires `getComponent` function')
  }

  const getContent =
    treeProps.getContent || context.getContent || (() => Promise.resolve(null))
  const output = context.output
  const quarantine =
    isClient ||
    (Object.prototype.hasOwnProperty.call(treeProps, 'quarantine')
      ? treeProps.quarantine
      : context.quarantine)

  const Quarantine = quarantine ? QuarantineComponent : QuarantineFragment

  function getCachedComponent(type) {
    const key = JSON.stringify({ type, output })
    if (!(key in componentCache)) {
      componentCache[key] = withTimer(getComponent(type, output))
    }
    return componentCache[key]
  }

  function Node(node: Composition.TreeNode) {
    const { props = {}, children = [], type, id } = node

    const Component = getCachedComponent(type) || null
    debug('rendering component:', {
      output: context.output,
      type,
      id,
      Component,
      props
    })

    const componentContextValue = { ...node, getContent }

    return (
      Component && (
        <componentContext.Provider value={componentContextValue}>
          <Quarantine {...node}>
            <Component {...props}>
              {[]
                .concat(children || [])
                .filter(({ type }) => getCachedComponent(type))
                .map((child, index) => (
                  <Node key={child.id || index} {...child} />
                ))}
            </Component>
          </Quarantine>
        </componentContext.Provider>
      )
    )
  }

  debug('rendering tree:', {
    output,
    template: context.template,
    quarantine
  })

  return <Node {...tree} />
})

export default Tree
