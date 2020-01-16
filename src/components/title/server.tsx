'use strict'

import React from 'react'

import { usePageContext } from '../../contexts/page'

export const Title = () => {
  const { title } = usePageContext()
  return <title>{title}</title>
}

export default Title
