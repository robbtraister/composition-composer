#!/usr/bin/env node

'use strict'

const cluster = require('cluster')

if (module === require.main) {
  const { master, server } = require('./build/server')
  ;(cluster.isMaster ? master : server)()
}
