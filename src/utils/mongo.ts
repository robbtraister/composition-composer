'use strict'

import { URL } from 'url'

import debugModule from 'debug'
import { MongoClient } from 'mongodb'

const debug = debugModule('composition:mongo')

async function getNewConnection(mongoUrl) {
  return new Promise<MongoClient>((resolve, reject) => {
    MongoClient.connect(
      mongoUrl,
      { useUnifiedTopology: true },
      (err, connection) => (err ? reject(err) : resolve(connection))
    )
  })
}

export function Mongo(mongoUrl) {
  const dbName = new URL(mongoUrl).pathname.replace(/^\/+/, '')

  let dbPromise
  async function getDatabase() {
    if (dbPromise) {
      const db = await dbPromise
      if (db && db.topology.isConnected()) {
        return db
      }
    }

    // keep this in Promise syntax due to caching impl
    dbPromise = getNewConnection(mongoUrl).then(conn => conn.db(dbName))

    return dbPromise
  }

  const collections = {}
  async function getCollection(collectionName) {
    if (collectionName in collections) {
      if (collections[collectionName] instanceof Promise) {
        return collections[collectionName]
      } else if (collections[collectionName].s.topology.isConnected()) {
        return Promise.resolve(collections[collectionName])
      }
    }

    // keep this in Promise syntax due to caching impl
    collections[collectionName] = getDatabase().then(db => {
      collections[collectionName] = db.collection(collectionName)
      return collections[collectionName]
    })

    return collections[collectionName]
  }

  const models = {}
  return {
    getModel(modelName) {
      models[modelName] = models[modelName] || {
        name: modelName,

        async find(query) {
          debug('finding documents:', { modelName, query })
          const collection = await getCollection(modelName)
          const cursor = await collection.find(query)
          const documents = await cursor.toArray()
          debug('found documents:', { modelName, query, documents })
          return documents
        },

        async findOne(query) {
          debug('finding document:', { modelName, query })
          const collection = await getCollection(modelName)
          const document = await collection.findOne(query)
          debug('found document:', { modelName, query, document })
          return document
        },

        async get(_id) {
          debug('getting document:', { modelName, _id })
          const collection = await getCollection(modelName)
          const document = await collection.findOne({ _id })
          debug('got document:', { modelName, _id, document })
          return document
        },

        async put(document) {
          debug('putting document:', { modelName, document })
          const collection = await getCollection(modelName)
          const result = await collection.update(
            { _id: document._id },
            document,
            { upsert: true }
          )
          debug('put document:', { modelName, document })
          return result
        },

        async remove() {
          // no-op on local
          return Promise.resolve()
        }
      }

      return models[modelName]
    }
  }
}

export default Mongo
