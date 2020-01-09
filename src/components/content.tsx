'use strict'

import React, { useContext, useState } from 'react'
import componentContext from '../contexts/component'
import compositionContext from '../contexts/composition'

export function useContent(params: ContentParams) {
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

export function Content(props: ContentComponentParams) {
  const { children, component: Component, render, ...contentProps } = props
  const { source, query, filter, ...passThroughProps } = contentProps
  const content = useContent({ source, query, filter }) || {}

  if (Component) {
    return <Component {...passThroughProps} content={content} />
  } else if (render) {
    return render({ ...passThroughProps, content })
  } else if (children) {
    return []
      .concat(children || [])
      .map((Child, index) => (
        <Child key={index} {...passThroughProps} content={content} />
      ))
  }
}

export default Content
