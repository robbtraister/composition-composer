'use strict'

import crypto from 'crypto'
import path from 'path'

import Concat from 'concat-with-sourcemaps'

import { readFile, writeFile } from './promises'

import env from '../../env'

export class Environment {
  mongoUrl?: string
  projectRoot: string
  readAsset: Function
  writeAsset: Function

  constructor(options: Composition.Options = {}) {
    Object.assign(this, env, options)
    this.readAsset = this.readAssetFile
    this.writeAsset = this.writeAssetFile
  }

  async compile({ components, name, format, template, tree = null }) {
    const { assets } = JSON.parse(
      await this.readResourceFile(path.join('build', 'assets.json'))
    )

    const assetMap = {}
    components.forEach(component => {
      ;(assets[`components/${component}/${format}`] || []).forEach(asset => {
        assetMap[asset] = true
      })
    })
    // include the engine entrypoint with the compiled script
    const mappedAssets = Object.keys(assetMap).concat('render.js')

    const css = (
      await Promise.all(
        mappedAssets
          .filter(asset => /\.css$/.test(asset))
          // try to keep compilation hashes consistent for re-use
          .sort()
          .map(asset => this.readAsset(asset))
      )
    ).join('\n')

    const styleHash = crypto.createHash('md5').update(css).digest('hex')

    const concat = [
      {
        asset: `${name}.js`,
        source: [
          `window.Composition=window.Composition||{}`,
          `Composition.format=${JSON.stringify(format)}`,
          `Composition.styleHash=${JSON.stringify(styleHash)}`,
          template ? `Composition.template=${JSON.stringify(template)}` : null,
          tree ? `Composition.tree=${JSON.stringify(tree)}` : null,
          `Composition.components=Composition.components||{}`
        ]
          .filter(source => source)
          .map(source => `${source};`)
          .join('\n')
      },
      ...(await Promise.all(
        mappedAssets
          .filter(asset => /\.js$/.test(asset))
          // don't sort here; order matters
          .map(async asset => {
            const source = await this.readAsset(asset)
            let sourceMap
            try {
              sourceMap = JSON.parse(await this.readAsset(`${asset}.map`))
            } catch (_) {}
            return {
              asset,
              source,
              sourceMap
            }
          })
      ))
    ].reduce(
      (
        concat,
        entry: { asset: string; source: string; sourceMap?: string }
      ) => {
        concat.add(entry.asset, entry.source, entry.sourceMap)
        return concat
      },
      new Concat(true, `${name}.js`, '\n')
    )

    const result = {
      js: concat.content,
      jsMap: concat.sourceMap,
      css,
      styleHash
    }

    await this.writeCompilation({ name, format }, result)

    return result
  }

  getAssetFile(name) {
    return this.getResourceFile(path.join('build', 'dist', name))
  }

  getResourceFile(name) {
    return path.resolve(this.projectRoot, name)
  }

  async readAssetFile(name, encoding = 'utf8') {
    return this.readResourceFile(this.getAssetFile(name), encoding)
  }

  async readResourceFile(name, encoding = 'utf8') {
    const buffer = await readFile(this.getResourceFile(name))
    return /^buffer$/i.test(encoding) ? buffer : buffer.toString(encoding)
  }

  async writeAssetFile(name, content) {
    return this.writeResourceFile(this.getAssetFile(name), content)
  }

  async writeResourceFile(name, content) {
    return writeFile(this.getResourceFile(name), content)
  }

  async writeCompilation({ name, format }, { css, js, jsMap, styleHash }) {
    return Promise.all([
      this.writeAsset(path.join(name, `${format}.js`), js),
      jsMap && this.writeAsset(path.join(name, `/${format}.js.map`), jsMap),
      this.writeAsset(
        path.join(name, `${format}.css.json`),
        JSON.stringify({ styleHash })
      ),
      styleHash &&
        css &&
        this.writeAsset(
          path.join('styles', 'templates', `${styleHash}.css`),
          css
        )
    ])
  }
}

export default Environment
