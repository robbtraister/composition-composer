interface Message {
  id?: string
  type?: string
  action?: string
  error?: object
}

interface Options {
  app?: {
    fileLimit?: number
    id?: string
    title?: string
  }
  auth?: {
    cookie: string
    secret: string
    providers: {
      facebook?: object
      google?: object
    }
  }
  host?: string
  isProd?: boolean
  port?: number
  projectRoot?: string
  workerCount?: number
}
