'use strict'

export class Unauthorized extends Error {
  statusCode: number

  constructor() {
    super('Unauthorized')
    this.statusCode = 403
  }
}

export default Unauthorized
