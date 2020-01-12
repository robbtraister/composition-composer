'use strict'

import debugModule from 'debug'
import React from 'react'

import RenderError from './error'

const debug = debugModule('composition:components:quarantine')

export class Quarantine extends React.PureComponent<TreeNode, { error: any }> {
  static displayName: string

  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  componentDidCatch(error) {
    const { type, id, props } = this.props
    debug('caught component error', { type, id, props, error })
    this.setState({ error })
  }

  render() {
    return this.state.error ? (
      <RenderError error={this.state.error} />
    ) : (
      this.props.children
    )
  }
}

export default Quarantine
