'use strict'

import React from 'react'

import { RenderError } from '../error'

export const withQuarantine = Component => {
  const isClass = Component.prototype instanceof React.Component

  return isClass
    ? class QuarantineComponent extends Component {
        render() {
          try {
            return super.render()
          } catch (error) {
            return <RenderError error={error} />
          }
        }
      }
    : passThroughProps => {
        try {
          return Component(passThroughProps)
        } catch (error) {
          return <RenderError error={error} />
        }
      }
}

export default withQuarantine
