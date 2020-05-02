'use strict'

import { createContext, useContext } from 'react'

import { render } from '../components/render'

const rootContext = createContext<Composition.RootProps>({})

export function useRootContext() {
  const {
    cache,
    getComponent,
    getContent,
    getResource,
    ...consumableContext
  } = useContext(rootContext)
  return consumableContext
}

export function RootContext(
  props: Composition.RenderableProps<{}, Composition.RootProps>
) {
  const context = useRootContext()
  return render({ ...props, ...context })
}

export default rootContext
