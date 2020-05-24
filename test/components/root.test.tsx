'use strict'

/* global expect, test */

import React from 'react'
import { renderToString } from 'react-dom/server'

import { App, Meta, Root, Styles, Title, useComponentContext } from '../../src'

const x = 3
function Fail() {
  if (x === 3) {
    throw new Error('component render failed')
  }
  return <React.Fragment />
}

function Success({ children }: { children: React.ElementType }) {
  const { id, type } = useComponentContext()
  return (
    <div data-type={type} data-id={id}>
      {children}
    </div>
  )
}

function getComponent(type: string): React.ComponentType {
  return type === 'fail' ? Fail : Success
}

const STATIC_STYLES = {
  'build/dist/site.css': 'body {margin: 0}',
  'build/dist/app.css': '* {text-decoration: none}'
}

const tree = {
  type: 'div',
  id: 'abc',
  children: [
    {
      type: 'fail',
      id: 'def',
      children: [
        {
          type: 'div',
          id: 'ghi'
        }
      ]
    },
    {
      type: 'div',
      id: 'xyz'
    }
  ]
}

test('Root Component', () => {
  const html = renderToString(
    <Root
      getComponent={getComponent}
      format="default"
      meta={{ viewport: 'width=device-width', charset: 'UTF-8' }}
      quarantine
      template="test"
      tree={tree}
      title="test title">
      <html>
        <head>
          <Meta />
          <Title />
          <Styles />
        </head>
        <body>
          <App single-page />
        </body>
      </html>
    </Root>
  )
  expect(html).toMatchSnapshot()
})

test('Inline Styles', () => {
  const html = renderToString(
    <Root
      getComponent={getComponent}
      getResource={key => STATIC_STYLES[key]}
      format="default"
      quarantine
      template="test"
      tree={tree}>
      <html>
        <head>
          <title>test</title>
          <Styles inline />
        </head>
        <body>
          <App single-page />
        </body>
      </html>
    </Root>
  )
  expect(html).toMatchSnapshot()
})
