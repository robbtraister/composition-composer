'use strict'

import React from 'react'
import ReactDOM from 'react-dom/server'
import { StaticRouter } from 'react-router'

import { RenderError } from '../error'
import { Node } from '../node'

import rootContext from '../../contexts/root'

export const Quarantine = React.Fragment

export const verifyNode = function verifyNode({ Component, element, context }) {
  try {
    ReactDOM.renderToStaticMarkup(
      <StaticRouter location={context.location}>
        <rootContext.Provider value={context}>
          <Node {...element} Component={Component} />
        </rootContext.Provider>
      </StaticRouter>
    )
    return Component
  } catch (error) {
    const ComponentError = () => <RenderError error={error} />
    return ComponentError
  }
}

export default Quarantine
