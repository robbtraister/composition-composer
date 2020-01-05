'use strict'

export default class Unauthenticated extends Error {
  statusCode: number

  constructor() {
    super('Unauthenticated')
    this.statusCode = 401
  }
}
