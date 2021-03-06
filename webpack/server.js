'use strict'

const path = require('path')
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const { DefinePlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const { aliases, mock } = require('../aliases')
const environment = require('./environment')
const { formats } = require('../project/manifest')
const OnBuildPlugin = require('./plugins/on-build-plugin')
const WriteConfigsPlugin = require('./plugins/write-configs-plugin')
const shared = require('./shared')

const { port, projectRoot } = environment

const serverBuildDir = path.join(projectRoot, 'build', 'server')

const entry = {
  index: [
    'source-map-support/register',
    `./${path.relative(
      projectRoot,
      path.resolve(__dirname, '..', 'src', 'server')
    )}`
  ]
}

const devMode = {
  // the following are set to enable proper server-side source-map error logging
  devtool: 'source-map',
  mode: 'development',
  optimization: {
    minimize: false,
    namedChunks: true,
    namedModules: true,
    splitChunks: false
  }
}

const externalPattern = /^(?!\.|~|@composition[\\/]composer[\\/])/
const externals = [
  ...Object.entries(aliases)
    .filter(([key]) => externalPattern.test(key))
    .map(([key, value]) => {
      return { [key]: value }
    }),
  externalPattern
]

const serverConfigs = {
  ...shared,
  ...devMode,
  name: 'server',
  externals,
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: serverBuildDir
  },
  target: 'node'
}

const buildArtifact = path.resolve(
  serverConfigs.output.path,
  Object.keys(entry)[0]
)
let hotApp

module.exports = (_, argv) => {
  const isProd = environment.isProd || /^prod/i.test(argv.mode)

  return [
    {
      ...serverConfigs,
      ...require('./shared/rules')({ isProd, extractCss: false }),
      devServer: {
        before: app => {
          // external dependencies are not built into artifact in dev mode
          // this ensures we reference the correct react lib
          mock()

          app.use((req, res, next) => {
            // re-require if recompiled so to get the latest code
            hotApp = hotApp || require(buildArtifact).app()
            hotApp(req, res, next)
          })
        },
        contentBase: path.join(projectRoot, 'public'),
        host: '0.0.0.0',
        index: '',
        port,
        publicPath: '/dist/',
        writeToDisk: true
      },
      entry: {
        ...entry,
        'compilations/components': `./${path.join(
          'build',
          'generated',
          'components'
        )}`
      },
      externals: isProd ? {} : externals,
      plugins: [
        new DefinePlugin({
          'typeof process': JSON.stringify(typeof {}),
          'typeof window': JSON.stringify(undefined)
        }),
        // invalidate dev server
        new OnBuildPlugin(async stats => {
          // clear compilation cache
          await exec(
            `rm -rf '${path.join(projectRoot, 'build/dist/templates')}'/*`
          )
          Object.keys(require.cache)
            .filter(mod => mod.startsWith(serverConfigs.output.path))
            .forEach(mod => {
              delete require.cache[mod]
            })
          hotApp = undefined
        }),
        new WriteConfigsPlugin(
          path.join(serverConfigs.output.path, 'compilations'),
          path.join(projectRoot, 'build', 'dist')
        )
      ],
      optimization: {
        ...serverConfigs.optimization,
        namedChunks: true,
        splitChunks: {
          chunks: 'async',
          cacheGroups: {
            default: {
              enforce: true,
              name(mod, chunks, cacheGroupKey) {
                return path.relative(
                  path.join(projectRoot, 'src'),
                  mod.resource
                )
              }
            }
          }
        }
      }
    },
    // compile format-specific CSS for SSR
    {
      ...serverConfigs,
      ...require('./shared/rules')({ isProd, extractCss: true }),
      entry: formats,
      optimization: {
        ...serverConfigs.optimization,
        minimize: isProd,
        minimizer: [new OptimizeCSSAssetsPlugin({})]
      },
      output: {
        ...serverConfigs.output,
        filename: 'junk/[name].js',
        path: path.join(projectRoot, 'build')
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: 'dist/styles/formats/[name].css'
        }),
        new OnBuildPlugin(async stats => {
          // remove extraneous assets
          exec(`rm -rf '${path.join(projectRoot, 'build/junk')}'`)
        })
      ]
    }
  ]
}
