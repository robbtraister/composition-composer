'use strict'

export function unpack(mod) {
  return mod && mod.__esModule ? Object.assign(mod.default || {}, mod) : mod
}

export default unpack
