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

interface ContentPromise extends Promise<object> {
  cached?: object
}

type ContentResult = ContentPromise | object
