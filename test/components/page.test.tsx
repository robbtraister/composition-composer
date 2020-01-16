'use strict'

/* global expect, test */

import React from 'react'
import { renderToString } from 'react-dom/server'

import { App, Meta, Page, Styles, Title, useComponentContext } from '../../src'
import Environment from '../../src/utils/environment'

const env = new Environment()

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

test('Page Component', () => {
  const html = renderToString(
    <Page
      getComponent={getComponent}
      meta={{ viewport: 'width=device-width', charset: 'UTF-8' }}
      output="default"
      template="test"
      tree={tree}
      title="test title"
      quarantine>
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
    </Page>
  )
  expect(html).toMatchSnapshot()
})

test('Inline Styles', () => {
  const html = renderToString(
    <Page
      getComponent={getComponent}
      getResource={env.readResourceFile.bind(env)}
      output="default"
      template="test"
      tree={tree}
      quarantine>
      <html>
        <head>
          <title>test</title>
          <Styles inline />
        </head>
        <body>
          <App single-page />
        </body>
      </html>
    </Page>
  )
  expect(html).toMatchSnapshot()
})
