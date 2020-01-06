'use strict'

const crypto = require('crypto')
const { promises: fsPromises } = require('fs')
const path = require('path')

const Concat = require('concat-with-sourcemaps')

const getDescendants = require('./descendants')
const { readFile, writeFile } = require('./promises')

const env = require('../../env')

// async function merge({ components, output }, { projectRoot }) {
//   const { assets } = JSON.parse(
//     await fsPromises.readFile(path.join(projectRoot, 'build', 'assets.json'))
//   )

//   const assetMap = {}
//   components.forEach(component => {
//     ;[].concat(assets[`components/${component}/${output}`]).forEach(asset => {
//       assetMap[asset] = false
//     })
//     assetMap[`components/${component}/${output}.js`] = component
//   })
//   const mappedAssets = Object.keys(assetMap)
// }

async function compile(
  { components, name, output, tree = null },
  { projectRoot = env.projectRoot } = {}
) {
  const { assets } = JSON.parse(
    await fsPromises.readFile(path.join(projectRoot, 'build', 'assets.json'))
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
        .map(asset => path.join(projectRoot, 'build', 'dist', asset))
        .map(filePath => readFile(filePath))
    )
  ).join('\n')

  const styleHash = crypto
    .createHash('md5')
    .update(css)
    .digest('hex')

  const concat = new Concat(true, `build/dist/${name}.js`, '\n')

  ;[
    {
      asset: `${name}.js`,
      source: `;window.Composition=window.Composition||{};
;Composition.output=${JSON.stringify(output)};
;Composition.styleHash=${JSON.stringify(styleHash)};
;Composition.template=${JSON.stringify(name.replace(/^templates[\\/]/, ''))};
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
    css,
    styleHash
  }

  await Promise.all([
    writeFile(
      path.join(projectRoot, `build/dist/${name}/${output}.js`),
      result.js
    ),
    result.jsMap &&
      writeFile(
        path.join(projectRoot, `build/dist/${name}/${output}.js.map`),
        result.jsMap
      ),
    writeFile(
      path.join(projectRoot, `build/dist/${name}/${output}.css.json`),
      JSON.stringify({ styleHash: result.styleHash })
    ),
    writeFile(
      path.join(
        projectRoot,
        `build/dist/styles/templates/${result.styleHash}.css`
      ),
      result.css
    )
  ])

  return result
}

async function compileTemplate({ template, output }, { projectRoot }) {
  const start = Date.now()

  try {
    const tree = JSON.parse(
      await fsPromises.readFile(
        path.join(projectRoot, 'templates', `${template}.json`)
      )
    )
    const components = getDescendants({ children: tree }).map(
      ({ type }) => type
    )

    return compile(
      { components, name: `templates/${template}`, output, tree },
      { projectRoot }
    )
  } finally {
    console.log(`${template} compiled in ${(Date.now() - start) / 1000}s`)
  }
}

module.exports = compileTemplate
module.exports.compile = compile
