'use strict'

const { exec } = require('child_process')
const crypto = require('crypto')
const path = require('path')

const { DefinePlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')

const environment = require('./environment')
const { components, outputs } = require('./manifest')

const { projectRoot } = environment

const componentNames = Object.keys(components)

const enginePath = path.resolve(__dirname, '../src/client')
const entry = Object.assign(
  {
    engine: enginePath
  },
  ...[].concat(
    ...componentNames.map(component =>
      Object.keys(components[component]).map(output => ({
        [`components/${component}/${output}`]: components[component][output]
      }))
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

  exec(`rm -rf ${path.join(projectRoot, 'build/dist/templates/*')}`)

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

class OnBuildPlugin {
  constructor(fn) {
    this.fn = fn
  }

  apply(compiler) {
    compiler.hooks.done.tap('OnBuildPlugin', this.fn)
  }
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

module.exports = (_, argv) => {
  const isProd = environment.isProd || /^prod/i.test(argv.mode)

  return {
    ...require('./shared'),
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
        name(mod, chunks, cacheGroupKey) {
          const chunkNames = [].concat(chunks).map(chunk => chunk.name)

          if (
            // engine is always loaded in the browser and will not change across templates,
            // so take advantage of heavy caching
            chunkNames.includes('engine') ||
            // if any standard libs are used, add to heavily-cached runtime asset
            runtimeLibs.includes(mod.rawRequest) ||
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

          return `components/_shared/${hash}`
        }
      },
      minimizer: [
        new TerserJSPlugin({
          sourceMap: true
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
      chunkFilename: '[name].js',
      // library: ['Composition', 'components', '[name]'],
      // libraryTarget: 'window',
      path: path.join(projectRoot, 'build', 'dist'),
      publicPath: '/dist/'
    },
    plugins: [
      new DefinePlugin({
        'typeof process': JSON.stringify(undefined),
        'typeof window': JSON.stringify(typeof {})
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[name].css'
      }),
      new OnBuildPlugin(writeAssets)
    ],
    target: 'web'
  }
}
