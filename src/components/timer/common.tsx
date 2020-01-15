'use strict'

import debugModule from 'debug'
import React from 'react'

import {
  ComponentContext,
  PageContext,
  useComponentContext,
  usePageContext
} from '../../contexts'

const debug = debugModule('composition:components:timer')

const superRenderFn = Symbol('super-render-function')

export function withTicTimer(tic) {
  function timedRender(renderFn, context) {
    const toc = tic()
    const result = renderFn()
    debug('rendered component:', {
      ...context,
      ms: toc()
    })
    return result
  }

  return function withTimer(Component) {
    if (!(debug.enabled && Component instanceof Function)) {
      return Component
    }

    const TimedComponent =
      Component.prototype instanceof React.Component
        ? class TimedComponent extends Component {
            [superRenderFn]: Function

            constructor(props) {
              super(props)
              this[superRenderFn] = super.render.bind(this)
            }

            render() {
              return (
                <PageContext>
                  {({ output }) => (
                    <ComponentContext>
                      {({ type, id }) =>
                        timedRender(this[superRenderFn], {
                          output,
                          type,
                          id
                        })
                      }
                    </ComponentContext>
                  )}
                </PageContext>
              )
            }
          }
        : props => {
            const { output } = usePageContext()
            const { type, id } = useComponentContext()
            return timedRender(Component.bind(null, props), {
              output,
              type,
              id
            })
          }

    Object.assign(TimedComponent, {
      displayName: Component.displayName || Component.name
    })

    return TimedComponent
  }
}

export default withTicTimer
