'use strict'

export class Server extends Error {
  statusCode: number

  constructor(statusCode: number = 500) {
    super('Internal Server Error')
    this.statusCode = statusCode
  }
}

export default Server
