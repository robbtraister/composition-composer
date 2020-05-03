'use strict'

const crypto = require('crypto')
const path = require('path')
// const util = require('util')
// const exec = util.promisify(require('child_process').exec)

const { BannerPlugin, DefinePlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')

const environment = require('./environment')
const { components, formats } = require('../project/manifest')
const OnBuildPlugin = require('./plugins/on-build-plugin')

const { isPreact, projectRoot } = environment

const componentNames = Object.keys(components)

const entrypointPath = path.resolve(__dirname, '../src/client')
const componentMap = {}
const entry = Object.assign(
  {
    render: entrypointPath
  },
  ...[].concat(
    ...componentNames.map(component =>
      Object.keys(components[component])
        .filter(format => components[component][format])
        .map(format => {
          const componentId = `components/${component}/${format}`
          componentMap[componentId] = component
          return {
            [componentId]: components[component][format]
          }
        })
    )
  )
)

const evergreenLibs = ['engine', 'render']
async function writeAssets(stats) {
  const { compilation } = stats
  const entrypoints = [...compilation.entrypoints.keys()]
  const assets = Object.assign(
    {},
    ...entrypoints
      .filter(entrypoint => !evergreenLibs.includes(entrypoint))
      .map(entrypoint => {
        const chunks = compilation.entrypoints.get(entrypoint).chunks
        return {
          [entrypoint]: [].concat(
            ...chunks
              .filter(chunk => !evergreenLibs.includes(chunk.name))
              .map(chunk => chunk.files)
          )
        }
      })
  )

  // await here to ensure assets are available before compiling
  await environment.writeResourceFile(
    path.join('build', 'assets.json'),
    JSON.stringify({ assets }, null, 2)
  )

  Object.keys(formats).map(format =>
    environment.compile({
      components: componentNames,
      name: 'combinations',
      format
    })
  )
}

// if any of these libs are used in the project, output them into the shared/heavily-cached engine asset
const engineLibs = [
  'prop-types',
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  'styled-components'
]

function isEngineLib(mod) {
  let pkg = mod
  while (pkg) {
    if (engineLibs.includes(pkg.rawRequest)) return true
    pkg = pkg.issuer
  }
  return false
}

const sharedConfigs = require('./shared')

module.exports = (_, argv) => {
  const isProd = environment.isProd || /^prod/i.test(argv.mode)

  return {
    ...sharedConfigs,
    ...require('./shared/rules')({ isProd, extractCss: true }),
    name: 'client',
    devtool: isProd ? 'hidden-source-map' : 'eval-source-map',
    entry,
    mode: isProd ? 'production' : 'development',
    node: {
      __dirname: false,
      __filename: false,
      global: true,
      process: true
    },
    optimization: {
      runtimeChunk: {
        name: 'engine'
      },
      splitChunks: {
        chunks: 'all',
        minSize: 0,
        cacheGroups: {
          default: {
            enforce: true,
            name(mod, chunks, cacheGroupKey) {
              const chunkNames = [].concat(chunks).map(chunk => chunk.name)

              if (
                // engine is always loaded in the browser and will not change across templates,
                // so take advantage of heavy caching
                chunkNames.includes('render') ||
                // if any standard libs are used, add to heavily-cached engine asset
                isEngineLib(mod) ||
                // put all node_modules in engine during dev to speed up recompilation
                (!isProd &&
                  /[\\/]node_modules[\\/]/.test(mod.resource || mod.request))
              ) {
                return 'engine'
              } else if (chunkNames.length === 1) {
                return chunkNames[0]
              }

              const chunkName = chunkNames.sort().join('~')

              const hash = crypto
                .createHash('md5')
                .update(chunkName)
                .digest()
                .toString('hex')

              return `chunks/${hash}`
            }
          }
        }
      },
      minimizer: [
        new TerserJSPlugin({
          sourceMap: true,
          cache: path.join(
            projectRoot,
            'node_modules',
            '.cache',
            'terser-webpack-plugin'
          )
        }),
        new OptimizeCSSAssetsPlugin({
          // cssProcessorOptions: {
          //   map: true
          // }
        })
      ]
    },
    output: {
      filename: '[name].js',
      // library: ['Composition', 'components', '[name]'],
      // libraryTarget: 'window',
      path: path.join(projectRoot, 'build', 'dist'),
      publicPath: '/dist/'
    },
    plugins: [
      new BannerPlugin({
        raw: true,
        entryOnly: true,
        test: /^components[\\/]/,
        banner: ({ chunk }) =>
          `;Composition.components[${JSON.stringify(
            componentMap[chunk.name]
          )}]=`
      }),
      new DefinePlugin({
        'typeof process': JSON.stringify(undefined),
        'typeof window': JSON.stringify(typeof {})
      }),
      new MiniCssExtractPlugin(),
      new OnBuildPlugin(async stats => {
        // clear template style cache; await so we don't clear the combinations created by writeAssets
        // await exec(
        //   `rm -rf '${path.join(projectRoot, 'build', 'dist', 'styles', 'templates')}'/*`
        // )
        writeAssets(stats)
      })
    ],
    resolve: {
      ...sharedConfigs.resolve,
      alias: {
        ...sharedConfigs.resolve.alias,
        react: require.resolve(isPreact && isProd ? 'preact/compat' : 'react'),
        'react-dom': require.resolve(
          isPreact && isProd ? 'preact/compat' : 'react-dom'
        )
      }
    },
    target: 'web'
  }
}
