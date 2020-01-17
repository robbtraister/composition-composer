'use strict'

import React from 'react'

import { RenderError } from '../error'

export const withQuarantine = Component => {
  return class Quarantine extends React.PureComponent<{}, { error: any }> {
    static displayName: string

    constructor(props) {
      super(props)
      this.state = { error: null }
    }

    componentDidCatch(error) {
      this.setState({ error })
    }

    render() {
      return this.state.error ? (
        <RenderError error={this.state.error} />
      ) : (
        <Component {...this.props} />
      )
    }
  }
}

export default withQuarantine
