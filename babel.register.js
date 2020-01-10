'use strict'

const { projectRoot } = require('./env')

require('@babel/register')({
  root: __dirname,
  ignore: [/[\\/]node_modules[\\/](?!@composition[\\/])/],
  only: [__dirname, projectRoot],

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
    '.json'
  ]
})
