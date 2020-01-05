'use strict'

const childProcess = require('child_process')
const path = require('path')

const { DefinePlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const env = require('../env')
const { port, projectRoot } = env

const {
  components: { outputs }
} = require('../src/manifest')()

class OnBuildPlugin {
  constructor(fn) {
    this.fn = fn
  }

  apply(compiler) {
    compiler.hooks.done.tap('OnBuildPlugin', this.fn)
  }
}

const entry = {
  index: [
    'source-map-support/register',
    path.relative(projectRoot, path.resolve(__dirname, '..', 'src', 'server'))
  ],
  master: [
    'source-map-support/register',
    path.relative(
      projectRoot,
      path.resolve(__dirname, '..', 'src', 'server', 'master')
    )
  ]
}

const buildArtifact = path.resolve(
  projectRoot,
  'build',
  'server',
  Object.keys(entry)[0]
)

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

module.exports = (_, argv) => {
  const isProd = env.isProd || /^prod/i.test(argv.mode)

  return [
    {
      ...require('./shared'),
      ...require('./shared/rules')({ isProd, extractCss: false }),
      ...devMode,
      name: 'server',
      devServer: {
        before: app => {
          app.use((req, res, next) => {
            // require on each request because the cache may have been cleared
            require(buildArtifact).devApp(req, res, next)
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
      output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        path: path.join(projectRoot, 'build', 'server')
      },
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
              new OnBuildPlugin(async stats => {
                Object.keys(require.cache)
                  .filter(pkg => !/[\\/]node_modules[\\/]/.test(pkg))
                  .forEach(pkg => {
                    delete require.cache[pkg]
                  })
              })
            ])
      ],
      target: 'node'
    },
    {
      ...require('./shared'),
      ...require('./shared/rules')({ isProd, extractCss: true }),
      ...devMode,
      name: 'server',
      entry: outputs,
      externals,
      optimization: {
        minimizer: [new OptimizeCSSAssetsPlugin({})]
      },
      output: {
        filename: 'junk/[name].js',
        libraryTarget: 'commonjs2',
        path: path.join(projectRoot, 'build')
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: 'dist/styles/outputs/[name].css'
        }),
        new OnBuildPlugin(async stats => {
          childProcess.exec(`rm -rf ${path.join(projectRoot, 'build/junk')}`)
        })
      ],
      target: 'node'
    }
  ]
}
