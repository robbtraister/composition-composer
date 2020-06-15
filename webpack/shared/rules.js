'use strict'

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const { fileLimit } = require('../environment')

module.exports = ({ isProd, extractCss }) => ({
  module: {
    rules: [
      {
        test: /\.(eot|gif|jpe?g|otf|png|ttf|woff2?)$/,
        use: {
          loader: require.resolve('url-loader'),
          options: {
            fallback: require.resolve('file-loader'),
            limit: fileLimit,
            name: isProd
              ? 'dist/assets/[hash].[ext]'
              : 'dist/assets/[path][name].[ext]',
            publicPath: '/'
          }
        }
      },
      {
        test: /\.s?[ac]ss$/,
        use: (extractCss
          ? [{ loader: MiniCssExtractPlugin.loader }]
          : []
        ).concat({
          loader: require.resolve('css-loader'),
          options: {
            modules: {
              localIdentName: isProd
                ? '[hash:base64]'
                : '[path][name]__[local]',
              mode: 'local'
            },
            onlyLocals: !extractCss,
            sourceMap: true
          }
        })
      },
      {
        test: /\.s[ac]ss$/,
        use: {
          loader: require.resolve('sass-loader'),
          options: {
            implementation: require('sass')
          }
        }
      },
      {
        test: /\.ya?ml$/,
        use: ['json-loader', 'yaml-loader']
      },
      {
        test: /\.m?[jt]sx?$/,
        exclude: /[\\/]node_modules[\\/]/,
        use: {
          loader: require.resolve('babel-loader'),
          options: require('../../babel.config.json')
        }
      },
      {
        test: /\.svg$/,
        use: [
          require.resolve('babel-loader'),
          require.resolve('react-svg-loader'),
          require.resolve('svgo-loader')
        ]
      }
    ]
  }
})
