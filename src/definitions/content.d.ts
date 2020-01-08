interface ContentParams {
  source: string
  query: object
  filter?: object
}

interface ContentComponentParams extends ContentParams {
  children?: React.ElementType | React.ElementType[]
  component?: React.ComponentType<{ content: any }>
  render?: Function
}

interface CachedPromise extends Promise<object> {
  value?: object
}

type ContentResult = CachedPromise | object
