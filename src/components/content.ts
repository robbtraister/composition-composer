'use strict'

import { useContext, useState } from 'react'

import { render } from './render'

import componentContext from '../contexts/component'
import compositionContext from '../contexts/composition'

export function useContent(params: Composition.ContentParams) {
  const { source, query } = params
  const key = JSON.stringify({ content: { source, query } })

  const { cache = {} } = useContext(compositionContext)
  const { getContent } = useContext(componentContext)

  /**
   * cacheEntry will always be some combination of the following (possibly both):
   * 1. a Promise
   * 2. an Object with `value` property
   */

  const cacheEntry = (cache[key] =
    cache[key] ||
    Promise.resolve(getContent(params)).then(data => {
      cacheEntry.value = data
      return data
    }))

  const [content, setContent] = useState(cacheEntry.value)

  if (cacheEntry instanceof Promise) {
    cacheEntry.then(setContent)
  }

  return content
}

export function Content(
  props: Composition.RenderableProps<
    Composition.ContentParams,
    Composition.ContentStruct
  >
) {
  const { source, query, filter, ...passThroughProps } = props
  const content = useContent({ source, query, filter }) || {}

  return render({ ...passThroughProps, content })
}

export default Content
