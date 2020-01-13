'use strict'

import React from 'react'

export function render(props: Composition.RenderableProps<any, any>) {
  const { children, component: Component, render, ...passThroughProps } = props

  if (Component) {
    return <Component {...passThroughProps} />
  } else if (render) {
    return render(passThroughProps)
  } else if (children) {
    return []
      .concat(children || [])
      .map((Child, index) => <Child key={index} {...passThroughProps} />)
  }
}

export default render
