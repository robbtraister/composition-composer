'use strict'

import { useContext, useState } from 'react'

import { render } from './render'

import componentContext from '../contexts/component'
import pageContext from '../contexts/page'

export function useContent(params: Composition.ContentParams) {
  const { source, query } = params
  const key = JSON.stringify({ content: { source, query } })

  const { cache = {} } = useContext(pageContext)
  const { getContent } = useContext(componentContext)

  /**
   * cache entry will always be some combination of the following (possibly both):
   * 1. a Promise
   * 2. an Object with `data` (and possibly, `expires`) property
   */

  const { value, expires } = cache[key] || {}
  const [content, setContent] = useState(value)

  if (!(key in cache) || expires < Date.now()) {
    const contentPromise: Composition.CachedPromise = Promise.resolve(
      getContent(params)
    )

    cache[key] = Object.assign(
      contentPromise.then(value => {
        cache[key].value = value
        setContent(value)
        return value
      }),
      // preserve cached data until update is resolved
      { value },
      // preserve cached props provided by custom getContent implementation
      contentPromise
    )
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
  const content = useContent({ source, query, filter })

  return render({ ...passThroughProps, content })
}

export default Content
