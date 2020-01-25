'use strict'

import React, { useContext } from 'react'
import ReactDOM from 'react-dom/server'
import { StaticRouter } from 'react-router'

import { RenderError } from '../error'

import componentContext from '../../contexts/component'
import pageContext from '../../contexts/page'

export const Quarantine = ({ children }) => {
  const componentContextValue = useContext(componentContext)
  const pageContextValue = useContext(pageContext)
  try {
    ReactDOM.renderToStaticMarkup(
      <StaticRouter location={pageContextValue.location}>
        <pageContext.Provider value={pageContextValue}>
          <componentContext.Provider value={componentContextValue}>
            {children}
          </componentContext.Provider>
        </pageContext.Provider>
      </StaticRouter>
    )
    return children
  } catch (error) {
    return <RenderError error={error} />
  }
}

export default Quarantine
