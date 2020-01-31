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

  interface RenderProps<T> {
    children?: React.ReactNode
    component?: React.ComponentType<T>
    render?: (t: T) => React.ReactElement | React.ReactElement[] | null
  }

  type RenderableProps<T1 extends object, T2 extends object> = T1 &
    RenderProps<T2>

  interface TreeNode {
    id: string
    type: string
    props?: object
    children?: object
    Component?: React.ComponentType
  }

  interface Resolution {
    title?: string
    meta?: object
    template?: string
    tree?: TreeNode
    pageContent?: object
  }

  type ComponentFetcher = (type: string) => React.ComponentType
  type ContentFetcher = (ContentParams) => object
  type ResourceFetcher = (name: string, encoding?: string) => any
  type Resolver = (string) => Promise<Resolution>

  interface TreeProps extends Resolution {
    quarantine?: boolean

    getComponent?: ComponentFetcher
  }

  interface CommonPageProps extends TreeProps {
    appName?: string
    appStyles?: string
    cache?: object
    elements?: TreeNode[]
    format?: string
    formatStyles?: string
    location?: string

    getContent?: ContentFetcher
    getResource?: ResourceFetcher
  }

  interface ClientPageProps extends CommonPageProps {
    forceRefresh?: boolean
    resolve?: Resolver
    'single-page'?: boolean
  }

  interface ServerPageProps extends CommonPageProps {
    children?: React.ReactNode
    routerContext?: { url?: string }
  }

  type PageProps = ClientPageProps | ServerPageProps

  interface ContentParams {
    source: string
    query: object
    filter?: object
  }

  type ContentResult = CachedPromise | object

  interface ContentStruct {
    content: any
  }

  interface ContextStruct {
    context: any
  }

  interface MetaStruct {
    name: string
    content: string
  }

  interface ResourceParams {
    name: string
    encoding?: string
  }

  interface ResourceStruct {
    resource: any
  }

  interface StylesStruct {
    styles: any
  }

  interface TitleStruct {
    title: string
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
