'use strict'

import React from 'react'
import ReactDOM from 'react-dom/server'
import { StaticRouter } from 'react-router'

import { RenderError } from '../error'
import { Node } from '../node'

import pageContext from '../../contexts/page'

export const Quarantine = React.Fragment

export const verifyNode = function verifyNode({ Component, element, context }) {
  try {
    ReactDOM.renderToStaticMarkup(
      <StaticRouter location={context.location}>
        <pageContext.Provider value={context}>
          <Node {...element} Component={Component} />
        </pageContext.Provider>
      </StaticRouter>
    )
    return Component
  } catch (error) {
    const ComponentError = () => <RenderError error={error} />
    return ComponentError
  }
}

export default Quarantine
