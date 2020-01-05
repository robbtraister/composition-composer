'use strict'

import crypto from 'crypto'
import { promises as fsPromises } from 'fs'
import path from 'path'

import Concat from 'concat-with-sourcemaps'

import { readFile, writeFile } from '../utils/promises'

import getDescendants from '../utils/descendants'

export default async function compile(name, { projectRoot }) {
  const start = Date.now()

  try {
    const tree = JSON.parse(
      await fsPromises.readFile(
        path.join(projectRoot, 'templates', `${name}.json`)
      )
    )
    const renderables = getDescendants({ children: tree })

    const { assets } = JSON.parse(
      await fsPromises.readFile(path.join(projectRoot, 'build', 'assets.json'))
    )

    const assetMap = {}
    renderables.forEach(({ collection, type }) => {
      ;[].concat(assets[`components/${collection}/${type}`]).forEach(asset => {
        assetMap[asset] = true
      })
    })
    const mappedAssets = Object.keys(assetMap)

    const css = (
      await Promise.all(
        mappedAssets
          .filter(asset => /\.css$/.test(asset))
          // try to keep compilation hashes consistent for re-use
          .sort()
          .map(asset => path.join(projectRoot, 'build', 'dist', asset))
          .map(filePath => readFile(filePath))
      )
    ).join('\n')

    const styleHash = crypto
      .createHash('md5')
      .update(css)
      .digest('hex')

    const concat = new Concat(true, `build/dist/templates/${name}.js`, '\n')

    ;(
      await Promise.all(
        mappedAssets
          .filter(asset => /\.js$/.test(asset))
          // don't sort here; order matters
          .map(async asset => {
            const assetPath = path.join(projectRoot, 'build', 'dist', asset)
            const source = await readFile(assetPath)
            let sourceMap
            try {
              sourceMap = JSON.parse(await readFile(`${assetPath}.map`))
            } catch (_) {}
            return {
              asset,
              source,
              sourceMap
            }
          })
          .concat({
            asset: `templates/${name}.js`,
            source: `;window.Composition=window.Composition||{};\n;Composition.tree=${JSON.stringify(
              tree
            )};\n;Composition.styleHash=${JSON.stringify(styleHash)};`
          })
      )
    ).map(entry => {
      concat.add(entry.asset, entry.source, entry.sourceMap)
    })

    const template = {
      js: concat.content,
      jsMap: concat.sourceMap,
      css
    }

    await Promise.all([
      writeFile(
        path.join(projectRoot, `build/dist/templates/${name}.js`),
        template.js
      ),
      template.jsMap &&
        writeFile(
          path.join(projectRoot, `build/dist/templates/${name}.js.map`),
          template.jsMap
        ),
      writeFile(
        path.join(projectRoot, `build/dist/templates/${name}.css.json`),
        JSON.stringify({ styleHash })
      ),
      writeFile(
        path.join(projectRoot, `build/dist/styles/templates/${styleHash}.css`),
        template.css
      )
    ])

    return template
  } finally {
    console.log(`${name} compiled in ${(Date.now() - start) / 1000}s`)
  }
}
