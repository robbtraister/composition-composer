'use strict'

const { exec } = require('child_process')
const crypto = require('crypto')
const { readFile, writeFile } = require('fs').promises
const path = require('path')

const { DefinePlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')

const env = require('../env')
const { projectRoot } = env

const { components } = require('./manifest')

const enginePath = path.resolve(__dirname, '../src/client')
const entry = Object.assign(
  {
    engine: enginePath
  },
  ...[].concat(
    ...Object.keys(components).map(type =>
      Object.keys(components[type]).map(output => ({
        [`components/${type}/${output}`]: components[type][output]
      }))
    )
  )
)

async function exportStats(stats) {
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

  writeFile(
    path.join(projectRoot, 'build/assets.json'),
    JSON.stringify({ assets }, null, 2)
  )
  exec(`rm -rf ${path.join(projectRoot, 'build/dist/templates/*')}`)

  const assetMap = {}
  ;[].concat(...Object.values(assets)).map(asset => {
    assetMap[asset] = true
  })
  writeFile(
    path.join(projectRoot, 'build/dist/components/combination.js'),
    (
      await Promise.all(
        Object.keys(assetMap)
          .filter(asset => /\.js$/.test(asset))
          .map(asset => readFile(path.join(projectRoot, 'build/dist', asset)))
      )
    ).join('\n')
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

module.exports = (_, argv) => {
  const isProd = env.isProd || /^prod/i.test(argv.mode)

  return {
    ...require('./shared'),
    ...require('./shared/rules')({ isProd, extractCss: true }),
    name: 'client',
    devtool: isProd ? 'source-map' : 'eval-source-map',
    entry,
    mode: isProd ? 'production' : 'development',
    optimization: {
      runtimeChunk: {
        name: 'runtime'
      },
      splitChunks: {
        chunks: 'all',
        minSize: 0,
        name(mod, chunks, cacheGroupKey) {
          const chunkNames = [].concat(chunks).map(chunk => chunk.name)

          if (chunkNames.includes('engine')) {
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
      new OnBuildPlugin(exportStats)
    ],
    // resolve: {
    //   ...require('./shared').resolve,
    //   alias: {
    //     ...require('./shared').resolve.alias,
    //     '@composition/components': require.resolve('@composition/components')
    //   }
    // },
    target: 'web'
  }
}
