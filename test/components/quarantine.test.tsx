'use strict'

/* global expect, test */

import React from 'react'
import { render } from '@testing-library/react'

import { Page, useComponentContext } from '../../src'

const x = 3

function FailFunction() {
  if (x === 3) {
    throw new Error('component render failed')
  }
  return <React.Fragment />
}

class FailClass extends React.Component {
  render() {
    return FailFunction()
  }
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
        id: 'xyz'
      }
    ]
  }
}

test('Quarantine Function Component', () => {
  const { asFragment } = render(
    <Page getComponent={getComponent} tree={getFailTree('fail-function')} />
  )
  expect(asFragment()).toMatchSnapshot()
})

test('Quarantine Class Component', () => {
  const { asFragment } = render(
    <Page getComponent={getComponent} tree={getFailTree('fail-class')} />
  )
  expect(asFragment()).toMatchSnapshot()
})
