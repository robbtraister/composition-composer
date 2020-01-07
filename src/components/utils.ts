'use strict'

export const isClient = typeof process === 'undefined'

export function getDescendants(node: { children?: React.ReactNode } = {}) {
  const children = [].concat(node.children || [])
  return children.concat(...children.map(getDescendants))
}
