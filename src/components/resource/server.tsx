'use strict'

import { promises as fsPromises } from 'fs'
import path from 'path'

import React, { useContext } from 'react'

import compositionContext from '../../contexts/composition'

const cachedFiles = {}
async function getCachedFile(filePath) {
  if (!(filePath in cachedFiles)) {
    try {
      cachedFiles[filePath] = await fsPromises.readFile(filePath)
    } catch (_) {}
  }
  return cachedFiles[filePath]
}

export function useResource(name, encoding = 'utf8') {
  const { cache = {}, projectRoot } = useContext(compositionContext)

  const key = JSON.stringify({ resource: name })
  if (!(key in cache)) {
    cache[key] = getCachedFile(path.join(projectRoot, name))
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
