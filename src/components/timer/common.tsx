'use strict'

import debugModule from 'debug'
import React from 'react'

import {
  ComponentContext,
  RootContext,
  useComponentContext,
  useRootContext
} from '../../contexts'

const debug = debugModule('composition:components:timer')

const superRenderFn = Symbol('super-render-function')

export function withTicTimer(tic, handler = null) {
  function timedRender(renderFn, context) {
    const toc = tic()
    const result = renderFn()
    const payload = { ...context, ms: toc() }
    debug('rendered component:', payload)
    handler && handler(payload)
    return result
  }

  return function withTimer(Component) {
    if (!(Component instanceof Function) || !handler || !debug.enabled) {
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
                <RootContext>
                  {({ format }) => (
                    <ComponentContext>
                      {({ type, id }) =>
                        timedRender(this[superRenderFn], {
                          format,
                          type,
                          id
                        })
                      }
                    </ComponentContext>
                  )}
                </RootContext>
              )
            }
          }
        : props => {
            const { format } = useRootContext()
            const { type, id } = useComponentContext()
            return timedRender(Component.bind(null, props), {
              format,
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
