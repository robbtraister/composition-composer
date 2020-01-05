'use strict'

import React from 'react'

import Error from './error'

import { TreeNode } from '../tree'

export class Quarantine extends React.Component<TreeNode, { error: any }> {
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
      <Error error={this.state.error} />
    ) : (
      this.props.children
    )
  }
}

export default Quarantine
