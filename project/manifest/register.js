'use strict'

const path = require('path')

const babelRegister = require('@babel/register')
const mockRequire = require('mock-require')

const aliases = require('../../aliases')
const babelConfigs = require('../../babel.config.json')
const { projectRoot } = require('../../env')

babelRegister({
  ...babelConfigs,
  root: path.resolve(__dirname, '..', '..'),
  ignore: [/[\\/]node_modules[\\/](?!@composition[\\/])/],
  only: [
    path.resolve(__dirname, '..', '..', 'src'),
    path.join(projectRoot, 'src')
  ],

  extensions: [
    '.tsx',
    '.ts',
    '.es6x',
    '.es6',
    '.esx',
    '.es',
    '.mjsx',
    '.mjs',
    '.jsx',
    '.js',
    '.cjsx',
    '.cjs',
    '.sass',
    '.scss',
    '.css'
  ],

  plugins: [
    ...babelConfigs.plugins,
    [
      'transform-require-ignore',
      {
        extensions: ['.css', '.sass', '.scss']
      }
    ]
  ]
})

Object.entries(aliases).forEach(([key, value]) =>
  mockRequire(key, require(value))
)
