'use strict'

import { useContext } from 'react'

import render from '../render'

import rootContext from '../../contexts/root'

export function useResource({
  name,
  encoding = 'utf8'
}: Composition.ResourceParams) {
  const { cache = {}, getResource } = useContext(rootContext)

  const key = JSON.stringify({ resource: name })
  if (!(key in cache)) {
    cache[key] = Promise.resolve(getResource(name, 'buffer'))
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
  props: Composition.RenderableProps<
    Composition.ResourceParams,
    Composition.ResourceStruct
  >
) {
  const { name, encoding, ...passThroughProps } = props
  const resource = useResource({ name, encoding })

  return render({ ...passThroughProps, resource })
}

export default Resource
