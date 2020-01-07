'use strict'

const crypto = require('crypto')
const path = require('path')

const Concat = require('concat-with-sourcemaps')

const {
  getTree,
  readAsset,
  readResourceFile,
  writeCompilation
} = require('./assets')

function getDescendants(node) {
  const children = [].concat(node.children || [])
  return children.concat(...children.map(getDescendants))
}

async function compile({ components, name, output, tree = null }) {
  const { assets } = JSON.parse(
    await readResourceFile(path.join('build', 'assets.json'))
  )

  const assetMap = {}
  components.forEach(component => {
    ;[].concat(assets[`components/${component}/${output}`]).forEach(asset => {
      assetMap[asset] = false
    })
    assetMap[`components/${component}/${output}.js`] = component
  })
  const mappedAssets = Object.keys(assetMap)

  const css = (
    await Promise.all(
      mappedAssets
        .filter(asset => /\.css$/.test(asset))
        // try to keep compilation hashes consistent for re-use
        .sort()
        .map(asset => readAsset(asset))
    )
  ).join('\n')

  const styleHash = crypto
    .createHash('md5')
    .update(css)
    .digest('hex')

  const concat = new Concat(true, `${name}.js`, '\n')

  ;[
    {
      asset: `${name}.js`,
      source: [
        `window.Composition=window.Composition||{}`,
        `Composition.output=${JSON.stringify(output)}`,
        `Composition.styleHash=${JSON.stringify(styleHash)}`,
        `Composition.template=${JSON.stringify(
          name.replace(/^templates[\\/]/, '')
        )}`,
        tree ? `Composition.tree=${JSON.stringify(tree)}` : null,
        `Composition.components=Composition.components||{}`
      ]
        .filter(c => c)
        .join(';\n;')
        .concat(';')
    },
    ...[].concat(
      ...(await Promise.all(
        mappedAssets
          .filter(asset => /\.js$/.test(asset))
          // don't sort here; order matters
          .map(async asset => {
            const key = assetMap[asset]
            const source = await readAsset(asset)
            let sourceMap
            try {
              sourceMap = JSON.parse(await readAsset(`${asset}.map`))
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
    css,
    styleHash
  }

  await writeCompilation({ name, output }, result)

  return result
}

async function compileTemplate({ template, output }) {
  const start = Date.now()

  try {
    const tree = await getTree(template)
    const components = getDescendants({ children: tree }).map(
      ({ type }) => type
    )

    return compile({ components, name: `templates/${template}`, output, tree })
  } finally {
    console.log(`${template} compiled in ${(Date.now() - start) / 1000}s`)
  }
}

module.exports = compileTemplate
module.exports.compile = compile
