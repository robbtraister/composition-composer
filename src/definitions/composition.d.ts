interface CachedPromise extends Promise<object> {
  value?: object
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
}

interface Resolution {
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
  getContent?: ContentFetcher
}

interface CommonCompositionProps extends TreeProps {
  appName?: string
  appStyles?: string
  cache?: object
  elements?: TreeNode[]
  location?: string
  output?: string
  outputStyles?: string

  getResource?: ResourceFetcher
}

interface ClientCompositionProps extends CommonCompositionProps {
  forceRefresh?: boolean
  resolve?: Resolver
  'single-page'?: boolean
}

interface ServerCompositionProps extends CommonCompositionProps {
  children?: React.ReactNode
  routerContext?: { url?: string }
}

type CompositionProps = ClientCompositionProps | ServerCompositionProps

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
