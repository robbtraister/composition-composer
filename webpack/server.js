'use strict'

const childProcess = require('child_process')
const path = require('path')

const { DefinePlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const env = require('../env')
const { port, projectRoot } = env

const { outputs } = require('./manifest')

class OnBuildPlugin {
  constructor(fn) {
    this.fn = fn
  }

  apply(compiler) {
    compiler.hooks.done.tap('OnBuildPlugin', this.fn)
  }
}

const entry = {
  server: [
    'source-map-support/register',
    path.relative(projectRoot, path.resolve(__dirname, '..', 'src', 'server'))
  ]
}

const buildArtifact = path.resolve(projectRoot, 'build', Object.keys(entry)[0])

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

const externals = (_, request, callback) => {
  ;/^(\.|~|@composition\/)/.test(request)
    ? callback()
    : callback(null, `commonjs ${require.resolve(request)}`)
}

const serverConfigs = {
  ...require('./shared'),
  ...devMode,
  name: 'server',
  externals,
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(projectRoot, 'build')
  },
  target: 'node'
}

let hotApp

module.exports = (_, argv) => {
  const isProd = env.isProd || /^prod/i.test(argv.mode)

  return [
    {
      ...serverConfigs,
      ...require('./shared/rules')({ isProd, extractCss: false }),
      devServer: {
        before: app => {
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
      entry,
      externals: isProd ? {} : externals,
      plugins: [
        // new SourceMapDevToolPlugin({
        //   test: /\.([cm]?[jt]sx?|s?[ac]ss|svg)$/,
        //   filename: '[name].js.map',
        //   sourceRoot: path.resolve(__dirname, '..')
        // }),
        new DefinePlugin({
          'typeof process': JSON.stringify(typeof {}),
          'typeof window': JSON.stringify(undefined)
        }),
        ...(isProd
          ? []
          : [
              new OnBuildPlugin(() => {
                delete require.cache[require.resolve(buildArtifact)]
                hotApp = undefined
              })
            ])
      ]
    },
    {
      ...serverConfigs,
      ...require('./shared/rules')({ isProd, extractCss: true }),
      entry: outputs,
      optimization: {
        minimizer: [new OptimizeCSSAssetsPlugin({})]
      },
      output: {
        ...serverConfigs.output,
        filename: 'junk/[name].js'
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: 'dist/styles/outputs/[name].css'
        }),
        new OnBuildPlugin(async stats => {
          childProcess.exec(`rm -rf ${path.join(projectRoot, 'build/junk')}`)
        })
      ]
    }
  ]
}
