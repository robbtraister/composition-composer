'use strict'

import React from 'react'
import ReactDOM from 'react-dom/server'
import { StaticRouter } from 'react-router'

import { RenderError } from '../error'
import { getDescendants } from '../utils'

import pageContext from '../../contexts/page'

export const Quarantine = React.Fragment

export const verify = function verify({ tree, context, Node }) {
  const elements = context.elements || getDescendants({ children: tree })
  const invertedElements = [...elements].reverse()
  invertedElements.forEach(element => {
    try {
      ReactDOM.renderToStaticMarkup(
        <StaticRouter location={context.location}>
          <pageContext.Provider value={context}>
            <Node {...element} />
          </pageContext.Provider>
        </StaticRouter>
      )
    } catch (error) {
      const ComponentError = () => <RenderError error={error} />
      element.component = ComponentError
    }
  })
}

export default Quarantine
