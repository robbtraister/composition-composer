'use strict'

import content from '~/build/generated/content'

export async function fetch({ source, query }) {
  return content.sources[source].fetch(query)
}
