'use strict'

import { createContext, useContext } from 'react'

import { render } from '../components/render'

const pageContext = createContext<Composition.PageProps>({})

export function usePageContext() {
  const {
    cache,
    quarantine,
    getComponent,
    getContent,
    getResource,
    ...consumableContext
  } = useContext(pageContext)
  return consumableContext
}

export function PageContext(
  props: Composition.RenderableProps<{}, Composition.PageProps>
) {
  const context = usePageContext()
  return render({ ...props, ...context })
}

export default pageContext
