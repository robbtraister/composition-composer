'use strict'

import React, { createContext, useContext } from 'react'

const componentContext = createContext<{
  type?: string
  id: any
  props?: object
  getContent?: (cp: ContentParams) => ContentResult
}>({
  type: null,
  id: null,
  props: {},

  getContent: () => null
})

export function useComponentContext() {
  return useContext(componentContext)
}

export function ComponentContext(props) {
  const { children, component: Component, render, ...otherProps } = props
  const context = useComponentContext()

  if (Component) {
    return <Component {...otherProps} context={context} />
  } else if (render) {
    return render({ ...otherProps, context })
  } else if (children) {
    return []
      .concat(children || [])
      .map((Child, index) => (
        <Child key={index} {...otherProps} context={context} />
      ))
  }
}

export default componentContext
