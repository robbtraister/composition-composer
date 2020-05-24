'use strict'

/* global expect, test */

import assert from 'assert'

import React from 'react'
import { render } from '@testing-library/react'

import { Root, useComponentContext, useRootContext } from '../../src'

function FailFunction() {
  // random logic to waste time
  let x = 0
  for (let i = 0; i < 10000000; i++) {
    x += i ** 2
  }

  // can't throw by default, so make math that is guaranteed to be truthy
  if (0 * x === 0) {
    throw new Error('component render failed')
  }
  return <React.Fragment />
}

class FailClass extends React.Component {
  render() {
    return (
      <>
        text
        <FailFunction />
      </>
    )
  }
}

function Success({ children }: { children: React.ElementType }) {
  const { id, type } = useComponentContext()
  const { location } = useRootContext()

  assert.equal(type, 'div')
  assert.equal(location, '/test')

  return (
    <div data-type={type} data-id={id}>
      {children}
    </div>
  )
}

function getComponent(type: string): React.ComponentType {
  return (
    {
      'fail-class': FailClass,
      'fail-function': FailFunction
    }[type] || Success
  )
}

function getFailTree(type) {
  return {
    type: 'div',
    id: 'abc',
    children: [
      {
        type,
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
        id: 'tuv',
        children: [
          {
            type: 'div',
            id: 'xyz'
          }
        ]
      }
    ]
  }
}

test('Quarantine Function Component', () => {
  const { asFragment } = render(
    <Root
      getComponent={getComponent}
      location="/test"
      tree={getFailTree('fail-function')}
      quarantine
    />
  )
  expect(asFragment()).toMatchSnapshot()
})

test('Quarantine Class Component', () => {
  const { asFragment } = render(
    <Root
      getComponent={getComponent}
      location="/test"
      tree={getFailTree('fail-class')}
      quarantine
    />
  )
  expect(asFragment()).toMatchSnapshot()
})
