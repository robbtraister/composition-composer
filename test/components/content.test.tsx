'use strict'

/* global describe, expect, test */

import PropTypes from 'prop-types'
import React from 'react'
import { act, render } from '@testing-library/react'

import Composition from '../../src/components/composition'
import { Content, useContent } from '../../src/components/content'

function Display({ content }) {
  return <div>{content && content.data}</div>
}

Display.propTypes = {
  content: PropTypes.shape({
    data: PropTypes.string
  })
}

function ContentChildren(props) {
  return <Content {...props}>{Display}</Content>
}

function ContentComponent(props) {
  return <Content {...props} component={Display} />
}

function ContentHook(props) {
  const content = useContent(props)
  return <Display content={content} />
}

function ContentRender(props) {
  return <Content {...props} render={Display} />
}

function getComponent({ type }) {
  switch (type) {
    case 'content-children':
      return ContentChildren
    case 'content-component':
      return ContentComponent
    case 'content-hook':
      return ContentHook
    case 'content-render':
      return ContentRender
  }
}

async function getContent({ source, query }) {
  return { data: `${source}: ${query.data}` }
}

const tree = {
  id: 'abc',
  props: {
    source: 'source',
    query: { data: 'data' }
  }
}

async function testContentComponent(componentType) {
  const cache = {}
  const result = render(
    <Composition
      getComponent={getComponent}
      getContent={getContent}
      tree={{ ...tree, type: componentType }}
      cache={cache}
    />
  )

  await act(() => Promise.all(Object.values(cache)))
  return result
}

describe('Content', () => {
  test('Content Children', async () => {
    const { asFragment } = await testContentComponent('content-children')
    expect(asFragment()).toMatchSnapshot()
  })

  test('Content Component', async () => {
    const { asFragment } = await testContentComponent('content-component')
    expect(asFragment()).toMatchSnapshot()
  })

  test('Content Hook', async () => {
    const { asFragment } = await testContentComponent('content-hook')
    expect(asFragment()).toMatchSnapshot()
  })

  test('Content Render', async () => {
    const { asFragment } = await testContentComponent('content-render')
    expect(asFragment()).toMatchSnapshot()
  })
})
