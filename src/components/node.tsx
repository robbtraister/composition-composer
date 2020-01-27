'use strict'

import debugModule from 'debug'
import React, { memo, useContext } from 'react'

import { Quarantine } from './quarantine'

import componentContext from '../contexts/component'
import pageContext from '../contexts/page'

const debug = debugModule('composition:components:node')

export const Node = memo(function Node(node: Composition.TreeNode) {
  const { props = {}, children = [], type, id, Component } = node
  const { getContent, output } = useContext(pageContext)

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
              .filter(({ Component }) => Component)
              .map((child, index) => (
                <Node key={child.id || index} {...child} />
              ))}
          </Component>
        </Quarantine>
      </componentContext.Provider>
    )
  )
})

export default Node
