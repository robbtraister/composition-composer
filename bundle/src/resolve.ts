'use strict'

export default function resolve(uri) {
  const template = uri === '/' ? 'homepage' : 'article'
  return { template }
}
