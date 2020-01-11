'use strict'

/* global expect, test */

import React from 'react'
import { render } from '@testing-library/react'

import Composition from '../../src/components/composition'
import { useComponentContext } from '../../src/contexts/component'

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

test('Quarantine Component', () => {
  const { asFragment } = render(
    <Composition getComponent={getComponent} tree={tree} quarantine />
  )
  expect(asFragment()).toMatchSnapshot()
})
