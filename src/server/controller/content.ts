'use strict'

import debugModule from 'debug'

import contentSources from '~/../build/generated/content-sources'
import request from 'request-promise-native'

import logger from '../../utils/logger'

const debug = debugModule('composition:controller:content')

const contentCache = {}

class ContentSource {
  name: string
  ttl: number
  fetchDirect: (query: object) => object | Promise<object>

  constructor(name: string, { fetch, resolve, ttl }) {
    this.name = name
    this.ttl = Math.max(Number(ttl) || 300000, 120000)

    if (fetch) {
      this.fetchDirect = fetch
    } else if (resolve) {
      this.fetchDirect = query => {
        const fetchPromise: Composition.CachedPromise = Promise.resolve(
          resolve(query)
        )
          .then(url =>
            request(url, {
              json: true,
              resolveWithFullResponse: true
            })
          )
          .then(({ body, headers }) => {
            fetchPromise.expires = headers.expires
            return body
          })
        return fetchPromise
      }
    } else {
      throw new Error('`fetch` or `resolve` is required for content source')
    }
  }

  getCacheKey(query) {
    return JSON.stringify({ source: this.name, query })
  }

  clear(query) {
    const cacheKey = this.getCacheKey(query)
    delete contentCache[cacheKey]
  }

  /* async */ fetch(query) {
    const cacheKey = this.getCacheKey(query)
    if (cacheKey in contentCache) {
      logger.info(`Content found in cache [${cacheKey}]`)
    } else {
      logger.info(`Content not found in cache; fetching [${cacheKey}]`)
      const cacheEntry: Composition.CachedPromise = (contentCache[
        cacheKey
      ] = Promise.resolve(this.fetchDirect(query)).then(data => {
        debug(`hydrated content [${cacheKey}]`, data)
        cacheEntry.data = data
        cacheEntry.expires = cacheEntry.expires || Date.now() + this.ttl
        return data
      }))
    }
    return contentCache[cacheKey]
  }

  /* async */ update(query) {
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
