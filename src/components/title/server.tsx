'use strict'

import React from 'react'

import { render } from '../render'

import { usePageContext } from '../../contexts/page'

const DefaultTitle = ({ title }: Composition.TitleStruct) => (
  <title>{title}</title>
)

export const Title = props => {
  const { title } = usePageContext()
  return render({
    // default implementation; can be overridden
    children: DefaultTitle,
    ...props,
    title
  })
}

export default Title
