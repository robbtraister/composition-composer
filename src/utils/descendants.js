'use strict'

module.exports = function getDescendants(node) {
  const children = [].concat(node.children || [])
  return children.concat(...children.map(getDescendants))
}
