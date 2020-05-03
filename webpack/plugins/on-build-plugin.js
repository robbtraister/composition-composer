'use strict'

class OnBuildPlugin {
  constructor(fn) {
    this.fn = fn
  }

  apply(compiler) {
    compiler.hooks.done.tap(this.constructor.name, this.fn)
  }
}

module.exports = OnBuildPlugin
