'use strict'

import React from 'react'

import { EntryComponent, ExitComponent } from './common'

const staticElementMap = {}
function loadStaticElements() {
  const entryElements = window.document.querySelectorAll(
    `[id^=${EntryComponent.prefix}\\:]`
  )
  Array.prototype.slice.call(entryElements).forEach(entryElement => {
    const id = entryElement.id.substr(`${EntryComponent.prefix}:`.length)
    const exitElement = window.document.getElementById(
      `${ExitComponent.prefix}:${id}`
    )
    if (exitElement) {
      const contentElements = []
      let contentElement = entryElement.nextSibling
      while (contentElement !== exitElement) {
        contentElements.push(contentElement)
        contentElement = contentElement.nextSibling
      }
      staticElementMap[id] = contentElements
      exitElement.parentElement.removeChild(exitElement)
    }
    entryElement.parentElement.removeChild(entryElement)
  })
}

// use interactive instead of DOMContentLoaded to ensure this triggers before render
if (document.readyState === 'loading') {
  document.addEventListener('readystatechange', event => {
    if (document.readyState === 'interactive') {
      loadStaticElements()
    }
  })
} else {
  loadStaticElements()
}

export class Static extends React.PureComponent<{
  id: string
  htmlOnly?: boolean
}> {
  exitRef: React.RefObject<HTMLDivElement>

  constructor(props) {
    super(props)

    this.exitRef = React.createRef<HTMLDivElement>()
  }

  componentDidMount() {
    this.update()
  }

  componentDidUpdate() {
    this.update()
  }

  update() {
    if (this.exitRef && this.exitRef.current) {
      const staticElements = staticElementMap[this.props.id]
      if (staticElements && staticElements.length) {
        const parent = this.exitRef.current.parentElement
        staticElements.forEach(staticElement => {
          const insertElement = this.props.htmlOnly
            ? staticElement.cloneNode(true)
            : staticElement
          parent.insertBefore(insertElement, this.exitRef.current)
        })
      }
    }
  }

  render() {
    return (
      <>
        <EntryComponent key={EntryComponent.prefix} id={this.props.id} />
        <ExitComponent
          key={ExitComponent.prefix}
          id={this.props.id}
          divRef={this.exitRef}
        />
      </>
    )
  }
}

export default Static
