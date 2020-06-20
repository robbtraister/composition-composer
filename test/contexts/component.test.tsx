'use strict'

/* global describe, expect, test */

import PropTypes from 'prop-types'
import React from 'react'
import { render } from '@testing-library/react'

import {
  ComponentContext,
  Root,
  useComponentContext
} from '@composition/components'

function Display({ id }) {
  return <div>{id}</div>
}

Display.propTypes = {
  id: PropTypes.string
}

const ContextChildren = () => {
  return <ComponentContext>{Display}</ComponentContext>
}

const ContextComponent = () => {
  return <ComponentContext component={Display} />
}

const ContextHook = () => {
  const context = useComponentContext()
  return <Display {...context} />
}

const ContextRender = () => {
  return <ComponentContext render={Display} />
}

function getComponent(type: string) {
  switch (type) {
    case 'context-children':
      return ContextChildren
    case 'context-component':
      return ContextComponent
    case 'context-hook':
      return ContextHook
    case 'context-render':
      return ContextRender
  }
}

const tree = {
  id: 'abc'
}

function testContextComponent(componentType) {
  return render(
    <Root getComponent={getComponent} tree={{ ...tree, type: componentType }} />
  )
}

describe('Context', () => {
  test('Context Children', async () => {
    const { asFragment } = testContextComponent('context-children')
    expect(asFragment()).toMatchSnapshot()
  })

  test('Context Component', async () => {
    const { asFragment } = testContextComponent('context-component')
    expect(asFragment()).toMatchSnapshot()
  })

  test('Context Hook', async () => {
    const { asFragment } = testContextComponent('context-hook')
    expect(asFragment()).toMatchSnapshot()
  })

  test('Context Render', async () => {
    const { asFragment } = testContextComponent('context-render')
    expect(asFragment()).toMatchSnapshot()
  })
})
