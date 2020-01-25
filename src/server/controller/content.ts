'use strict'

import debugModule from 'debug'

import contentSources from '~/../build/generated/content-sources'
import request from 'request-promise-native'

import logger from '../../utils/logger'

const debug = debugModule('composition:controller:content')

const contentCache = {}

function fetchFromResolve(resolve) {
  return query => {
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
        fetchPromise.expires = +new Date(headers.expires)
        return body
      })
    return fetchPromise
  }
}

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
      this.fetchDirect = fetchFromResolve(resolve)
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
      const cacheEntry = contentCache[cacheKey]
      if (cacheEntry.expires < Date.now()) {
        logger.info(`Content in cache is expired; fetching [${cacheKey}]`)
      } else {
        logger.info(`Content found in cache [${cacheKey}]`)
        return cacheEntry
      }
    } else {
      logger.info(`Content not found in cache; fetching [${cacheKey}]`)
    }

    const cacheEntry: Composition.CachedPromise = (contentCache[
      cacheKey
    ] = Promise.resolve(this.fetchDirect(query)).then(value => {
      debug(`hydrated content [${cacheKey}]`, value)
      cacheEntry.value = value
      cacheEntry.expires = cacheEntry.expires || Date.now() + this.ttl
      return value
    }))

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
