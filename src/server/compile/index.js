'use strict'

import crypto from 'crypto'
import { promises as fsPromises } from 'fs'
import path from 'path'

import Concat from 'concat-with-sourcemaps'

import { readFile, writeFile } from '../utils/promises'

import getDescendants from '../utils/descendants'

export default async function compile({ template, output }, { projectRoot }) {
  const start = Date.now()

  try {
    const tree = JSON.parse(
      await fsPromises.readFile(
        path.join(projectRoot, 'templates', `${template}.json`)
      )
    )
    const renderables = getDescendants({ children: tree })

    const { assets } = JSON.parse(
      await fsPromises.readFile(path.join(projectRoot, 'build', 'assets.json'))
    )

    const assetMap = {}
    renderables.forEach(({ type }) => {
      ;[].concat(assets[`components/${type}/${output}`]).forEach(asset => {
        assetMap[asset] = null
      })
      assetMap[`components/${type}/${output}.js`] = type
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

    const concat = new Concat(
      true,
      `build/dist/templates/${template}/${output}.js`,
      '\n'
    )

    ;[
      {
        asset: `templates/${template}/${output}.js`,
        source: `;window.Composition=window.Composition||{};
;Composition.output=${JSON.stringify(output)};
;Composition.styleHash=${JSON.stringify(styleHash)};
;Composition.template=${JSON.stringify(template)};
;Composition.tree=${JSON.stringify(tree)};
;Composition.components=Composition.components||{};`
      },
      ...[].concat(
        ...(await Promise.all(
          mappedAssets
            .filter(asset => /\.js$/.test(asset))
            // don't sort here; order matters
            .map(async asset => {
              const key = assetMap[asset]
              const assetPath = path.join(projectRoot, 'build', 'dist', asset)
              const source = await readFile(assetPath)
              let sourceMap
              try {
                sourceMap = JSON.parse(await readFile(`${assetPath}.map`))
              } catch (_) {}
              const result = {
                asset,
                source,
                sourceMap
              }
              return key
                ? [
                    {
                      asset: `${key}.js`,
                      source: `;Composition.components[${JSON.stringify(key)}]=`
                    },
                    result
                  ]
                : result
            })
        ))
      )
    ].map(entry => {
      concat.add(entry.asset, entry.source, entry.sourceMap)
    })

    const result = {
      js: concat.content,
      jsMap: concat.sourceMap,
      css
    }

    await Promise.all([
      writeFile(
        path.join(projectRoot, `build/dist/templates/${template}/${output}.js`),
        result.js
      ),
      template.jsMap &&
        writeFile(
          path.join(
            projectRoot,
            `build/dist/templates/${template}/${output}.js.map`
          ),
          result.jsMap
        ),
      writeFile(
        path.join(
          projectRoot,
          `build/dist/templates/${template}/${output}.css.json`
        ),
        JSON.stringify({ styleHash })
      ),
      writeFile(
        path.join(projectRoot, `build/dist/styles/templates/${styleHash}.css`),
        result.css
      )
    ])

    return result
  } finally {
    console.log(`${template} compiled in ${(Date.now() - start) / 1000}s`)
  }
}
