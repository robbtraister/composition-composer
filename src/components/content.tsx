'use strict'

import React, { useEffect, useState } from 'react'
import { useComponentContext } from '../contexts/component'

export function useContent(props: ContentParams) {
  const { getContent } = useComponentContext()
  const contentResult: ContentPromise = getContent(props)
  const [content, setContent] = useState(contentResult.cached)

  useEffect(() => {
    let doUpdate = true
    const awaitFetch = async () => {
      const updated = await contentResult
      doUpdate && setContent(updated)
    }
    contentResult && awaitFetch()

    return () => {
      doUpdate = false
    }
  }, [contentResult])

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
