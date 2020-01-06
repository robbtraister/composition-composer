'use strict'

import contentSources from '~/../build/generated/content-sources'

export async function fetch({ source, query }) {
  return contentSources[source].fetch(query)
}
