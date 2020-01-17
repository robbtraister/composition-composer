'use strict'

const crypto = require('crypto')
const path = require('path')

const { BannerPlugin, DefinePlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')

const environment = require('./environment')
const { components, outputs } = require('../bundle/manifest')
const OnBuildPlugin = require('./plugins/on-build-plugin')

const { isPreact, projectRoot } = environment

const componentNames = Object.keys(components)

const enginePath = path.resolve(__dirname, '../src/client')
const componentMap = {}
const entry = Object.assign(
  {
    engine: enginePath
  },
  ...[].concat(
    ...componentNames.map(component =>
      Object.keys(components[component])
        .filter(output => components[component][output])
        .map(output => {
          const componentId = `components/${component}/${output}`
          componentMap[componentId] = component
          return {
            [componentId]: components[component][output]
          }
        })
    )
  )
)

async function writeAssets(stats) {
  const { compilation } = stats
  const entrypoints = [...compilation.entrypoints.keys()]
  const assets = Object.assign(
    {},
    ...entrypoints
      .filter(entrypoint => !['engine', 'runtime'].includes(entrypoint))
      .map(entrypoint => {
        const chunks = compilation.entrypoints.get(entrypoint).chunks
        return {
          [entrypoint]: [].concat(
            ...chunks
              .filter(chunk => !['engine', 'runtime'].includes(chunk.name))
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

  Object.keys(outputs).map(output =>
    environment.compile({
      components: componentNames,
      name: 'combinations',
      output
    })
  )
}

// if any of these libs are used in the bundle, output them into the shared/heavily-cached runtime asset
const runtimeLibs = [
  'prop-types',
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  'styled-components'
]

function isRuntimeLib(mod) {
  let pkg = mod
  while (pkg) {
    if (runtimeLibs.includes(pkg.rawRequest)) return true
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
    devtool: isProd ? 'source-map' : 'eval-source-map',
    entry,
    mode: isProd ? 'production' : 'development',
    node: {
      __dirname: false,
      __filename: false,
      global: false,
      process: false
    },
    optimization: {
      runtimeChunk: {
        name: 'runtime'
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
                chunkNames.includes('engine') ||
                // if any standard libs are used, add to heavily-cached runtime asset
                isRuntimeLib(mod) ||
                // put all libs in runtime during dev to speed up recompilation
                (!isProd &&
                  /[\\/]node_modules[\\/]/.test(mod.resource || mod.request))
              ) {
                return 'runtime'
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
      new OnBuildPlugin(writeAssets)
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
