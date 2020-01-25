'use strict'

import debugModule from 'debug'
import React, { memo, useContext, useState } from 'react'

import { Quarantine as QuarantineComponent } from './quarantine'
import { withTimer } from './timer'
import { isClient } from './utils'

import componentContext from '../contexts/component'
import pageContext from '../contexts/page'

const debug = debugModule('composition:components:tree')

export const Tree = memo(function Tree(treeProps: Composition.TreeProps) {
  const [componentCache] = useState({})
  const context = useContext(pageContext)

  const getComponent = treeProps.getComponent || context.getComponent
  const tree = treeProps.tree || context.tree

  if (tree && !getComponent) {
    throw new Error('Use of `tree` requires `getComponent` function')
  }

  const getContent =
    treeProps.getContent || context.getContent || (() => Promise.resolve(null))
  const output = context.output
  const isQuarantine =
    isClient ||
    ('quarantine' in treeProps ? treeProps.quarantine : context.quarantine)
  const Quarantine = isQuarantine ? QuarantineComponent : React.Fragment

  function getCachedComponent(type) {
    if (!(type in componentCache)) {
      componentCache[type] = withTimer(getComponent(type))
    }
    return componentCache[type]
  }

  function Node(node: Composition.TreeNode) {
    const { props = {}, children = [], type, id } = node

    const Component = getCachedComponent(type) || null
    debug('rendering component:', {
      output,
      type,
      id,
      Component,
      props
    })

    const componentContextValue = { ...node, getContent }

    return (
      Component && (
        <componentContext.Provider value={componentContextValue}>
          <Quarantine>
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
    tree
  })

  return <Node {...tree} />
})

export default Tree
