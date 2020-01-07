'use strict'

const { URL } = require('url')

const { getHash, getTree } = require('./assets')

async function resolve({ uri, output = 'default' }, options) {
  const url = new URL(uri, 'http://a.com')
  const template = url.pathname === '/' ? 'homepage' : 'article'

  return {
    output,
    styleHash: await getHash({ template, output }, options),
    template,
    tree: await getTree(template, options),
    uri
  }
}

module.exports = resolve
module.exports.resolve = resolve
