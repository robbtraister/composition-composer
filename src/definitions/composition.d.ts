declare namespace Composition {
  interface Model {
    findAll: (query: object) => object[]
    findOne: (query: object) => object
    get: (id: any) => object
    put: (document: object) => void
  }

  interface DB {
    getModel: (string) => Model
  }

  interface CachedPromise extends Promise<any> {
    value?: any
    expires?: number
  }

  interface ContentParams {
    source: string
    query: object
    filter?: object
  }

  interface Options {
    isProd?: boolean
    isPreact?: boolean
    logLevel?: string
    mongoUrl?: string
    port?: number
    projectRoot?: string
    workerCount?: number
  }
}
