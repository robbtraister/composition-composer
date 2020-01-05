'use strict'

function unpack(mod) {
  return mod && mod.__esModule && mod.default ? mod.default : mod
}

module.exports = unpack
