'use strict'

export const isClient =
  typeof process === 'undefined' ||
  !!process.browser ||
  !process.version ||
  process.argv.length === 0

export function getDescendants(node: { children?: React.ReactNode } = {}) {
  const children = [].concat(node.children || [])
  return children.concat(...children.map(getDescendants))
}
