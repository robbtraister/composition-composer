'use strict'

import debug from 'debug'

const debugWorker = debug(`composition:worker:${process.pid}`)

function generateRandomId() {
  return `${Date.now()}${`${Math.random()}`.replace(/^[0.]+/, '')}`
}

export async function sendMessage(outgoingMessage: Message) {
  return new Promise((resolve, reject) => {
    const outgoingId = outgoingMessage.id || generateRandomId()

    const responseHandler = (responseMessage: Message = {}) => {
      const { id, type } = responseMessage
      if (id === outgoingId) {
        process.off('message', responseHandler)
        switch (type) {
          case 'complete':
          case 'success':
            resolve(responseMessage)
            break
          default:
            reject(responseMessage.error || responseMessage)
        }
      }
    }

    process.on('message', responseHandler)
    process.send({ id: outgoingId, ...outgoingMessage })
    debugWorker(
      `Sent message: ${outgoingMessage.action ||
        outgoingMessage.type ||
        outgoingMessage}`
    )
  })
}

export default sendMessage
