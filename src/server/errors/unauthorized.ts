'use strict'

export default class Unauthorized extends Error {
  statusCode: number

  constructor() {
    super('Unauthorized')
    this.statusCode = 403
  }
}
