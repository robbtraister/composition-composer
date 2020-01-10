'use strict'

const path = require('path')

const { projectRoot } = require('./env')

require('@babel/register')({
  root: __dirname,
  ignore: [/[\\/]node_modules[\\/](?!@composition[\\/])/],
  only: [path.join(__dirname, 'src'), path.join(projectRoot, 'src')],

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
    '.cjs'
  ]
})
