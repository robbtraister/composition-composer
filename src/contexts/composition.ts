'use strict'

import { createContext, useContext } from 'react'

import { render } from '../components/render'

export const compositionContext = createContext<CompositionProps>({})

export function useCompositionContext() {
  const {
    cache,
    quarantine,
    getComponent,
    getContent,
    getResource,
    ...consumableContext
  } = useContext(compositionContext)
  return consumableContext
}

export function CompositionContext(props: RenderableProps<{}, ContextStruct>) {
  const context = useCompositionContext()
  return render({ ...props, context })
}

export default compositionContext
