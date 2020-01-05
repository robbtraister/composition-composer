'use strict'

export default class Redirect extends Error {
  location: string
  statusCode: number

  constructor(location: string, statusCode: number = 302) {
    super(`redirect to: ${location}`)
    this.location = location
    this.statusCode = statusCode
  }
}
