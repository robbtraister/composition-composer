'use strict'

export default function getDescendants(node) {
  const children = [].concat(node.children || [])
  return children.concat(...children.map(getDescendants))
}
