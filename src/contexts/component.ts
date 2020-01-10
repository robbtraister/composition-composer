'use strict'

import { createContext, useContext } from 'react'

import { render } from '../components/render'

const componentContext = createContext<
  TreeNode & { getContent: ContentFetcher }
>({
  type: null,
  id: null,
  props: {},

  getContent: () => null
})

export function useComponentContext() {
  const { getContent, ...consumableContext } = useContext(componentContext)
  return consumableContext
}

export function ComponentContext(props: RenderableProps<{}, ContextStruct>) {
  const context = useComponentContext()
  return render({ ...props, context })
}

export default componentContext
