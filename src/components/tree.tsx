'use strict'

import debugModule from 'debug'
import React, { memo, useContext, useState } from 'react'

import { Node } from './node'
import { verifyNode } from './quarantine'
import { withTimer } from './timer'
import { getDescendants } from './utils'

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

  const output = context.output
  const isQuarantine =
    'quarantine' in treeProps ? treeProps.quarantine : context.quarantine

  function getCachedComponent(type) {
    if (!(type in componentCache)) {
      componentCache[type] = withTimer(getComponent(type))
    }
    return componentCache[type]
  }

  debug('rendering tree:', {
    output,
    template: context.template,
    tree
  })

  const elements = context.elements || getDescendants({ children: tree })
  const invertedElements = [...elements].reverse()
  invertedElements.forEach(element => {
    const Component = getCachedComponent(element.type) || null
    element.Component = isQuarantine
      ? verifyNode({ Component, element, context })
      : Component
  })

  return <Node {...tree} />
})

export default Tree
