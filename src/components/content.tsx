'use strict'

import React, { useEffect, useState } from 'react'
import { useComponentContext } from '../contexts/component'

function useContent(props: ContentParams) {
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

function Content(props: ContentComponentParams) {
  const { children, component: Component, render, ...contentProps } = props
  const { source, query, filter, ...otherProps } = contentProps
  const content = useContent({ source, query, filter }) || {}

  if (Component) {
    return <Component {...otherProps} content={content} />
  } else if (render) {
    return render({ ...otherProps, content })
  } else if (children) {
    return []
      .concat(children || [])
      .map((Child, index) => (
        <Child key={index} {...otherProps} content={content} />
      ))
  }
}

export default Content
export { Content, useContent }
