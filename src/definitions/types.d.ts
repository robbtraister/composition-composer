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
  logLevel?: string
  port?: number
  resources?: any
  projectRoot?: string
  workerCount?: number
}

interface AuthenticateOptions {
  cookie: string
  secret: string
  scope?: string[]
  state?: string
  successRedirect?: any
}
