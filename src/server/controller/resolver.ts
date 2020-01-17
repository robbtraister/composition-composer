'use strict'

interface ResolverParams {
  pattern?: string | RegExp
  template: string
  uri?: string
}

export class Resolver {
  params: ResolverParams
  pattern: RegExp

  constructor(resolver: ResolverParams) {
    this.params = resolver
    this.pattern = resolver.uri
      ? new RegExp(`^${resolver.uri}$`, 'i')
      : new RegExp(resolver.pattern)
  }

  match(uri) {
    const match = this.pattern.exec(uri)
    return match
      ? {
          ...this.params,
          match
        }
      : null
  }
}

export default Resolver
