'use strict'

export class Unauthenticated extends Error {
  statusCode: number

  constructor() {
    super('Unauthenticated')
    this.statusCode = 401
  }
}

export default Unauthenticated
