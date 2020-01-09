'use strict'

import React, { useContext } from 'react'

import compositionContext from '../../contexts/composition'

export function useResource(name, encoding = 'utf8') {
  const { cache = {}, getResource } = useContext(compositionContext)

  const key = JSON.stringify({ resource: name })
  if (!(key in cache)) {
    cache[key] = getResource(name, 'buffer')
      .then(data => {
        cache[key] = data
      })
      .catch(() => {
        cache[key] = null
      })
  }

  return cache[key] instanceof Promise
    ? null
    : /^buffer$/i.test(encoding)
    ? cache[key]
    : cache[key] && cache[key].toString(encoding)
}

export function Resource(props: {
  name: string
  children?: React.ElementType | React.ElementType[]
  component?: React.ComponentType<{ resource: any }>
  render?: Function
}) {
  const { children, component: Component, render, ...resourceProps } = props
  const { name, ...passThroughProps } = resourceProps
  const resource = useResource(name)

  if (Component) {
    return <Component {...passThroughProps} resource={resource} />
  } else if (render) {
    return render({ ...passThroughProps, resource })
  } else if (children) {
    return []
      .concat(children || [])
      .map((Child, index) => (
        <Child key={index} {...passThroughProps} resource={resource} />
      ))
  }
}

export default Resource
