'use strict'

import contentSources from '~/../build/generated/content-sources'
import request from 'request-promise-native'

import logger from '../../utils/logger'

const contentCache = {}

class ContentSource {
  name: string
  fetchDirect: Function

  constructor(name, { fetch, resolve }) {
    this.name = name

    if (fetch) {
      this.fetchDirect = fetch
    } else if (resolve) {
      this.fetchDirect = async query =>
        request(await resolve(query), { json: true })
    } else {
      throw new Error('`fetch` or `resolve` is required for content source')
    }
  }

  clear(query) {
    const cacheKey = this.getCacheKey(query)
    delete contentCache[cacheKey]
  }

  async fetch(query) {
    const cacheKey = this.getCacheKey(query)
    if (cacheKey in contentCache) {
      logger.info(`Content found in cache [${cacheKey}]`)
    } else {
      logger.info(`Content not found in cache; fetching [${cacheKey}]`)
      contentCache[cacheKey] = await this.fetchDirect(query)
    }
    return contentCache[cacheKey]
  }

  getCacheKey(query) {
    return JSON.stringify({ source: this.name, query })
  }

  async update(query) {
    this.clear(query)
    return this.fetch(query)
  }
}

const contentSourceCache = {}
export function getContentSource(source) {
  if (!(source in contentSourceCache)) {
    const contentSource = contentSources[source]
    contentSourceCache[source] = new ContentSource(source, contentSource)
  }
  return contentSourceCache[source]
}

export async function clear({ source, query }: Composition.ContentParams) {
  return getContentSource(source).clear(query)
}

export async function fetch({ source, query }: Composition.ContentParams) {
  return getContentSource(source).fetch(query)
}

export async function update({ source, query }: Composition.ContentParams) {
  return getContentSource(source).update(query)
}
