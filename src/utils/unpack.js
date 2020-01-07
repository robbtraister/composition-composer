'use strict'

function unpack(mod) {
  return mod && mod.__esModule ? Object.assign(mod.default || {}, mod) : mod
}

module.exports = unpack
