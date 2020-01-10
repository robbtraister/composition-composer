'use strict'

import { useContext } from 'react'

import render from '../render'

import compositionContext from '../../contexts/composition'

export function useResource({ name, encoding = 'utf8' }: ResourceParams) {
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

export function Resource(
  props: RenderableProps<ResourceParams, ResourceStruct>
) {
  const { name, encoding, ...passThroughProps } = props
  const resource = useResource({ name, encoding })

  return render({ ...passThroughProps, resource })
}

export default Resource
