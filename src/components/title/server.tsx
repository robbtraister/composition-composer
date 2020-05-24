'use strict'

import React from 'react'

import { render } from '../render'

import { useRootContext } from '../../contexts/root'

const DefaultTitle = ({ title }: Composition.TitleStruct) => (
  <title>{title}</title>
)

export const Title = props => {
  const { title } = useRootContext()
  return render({
    // default implementation; can be overridden
    children: DefaultTitle,
    title,
    ...props
  })
}

export default Title
