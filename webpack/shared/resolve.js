'use strict'

const path = require('path')

const { projectRoot } = require('../../env')

module.exports = {
  resolve: {
    alias: {
      '~': path.join(projectRoot, 'src'),
      'prop-types/checkPropTypes': require.resolve('prop-types/checkPropTypes'),
      'prop-types': require.resolve('prop-types'),
      react: require.resolve('react'),
      'react-dom/server': require.resolve('react-dom/server'),
      'react-dom': require.resolve('react-dom'),
      'react-router': require.resolve('react-router'),
      'react-router-dom': require.resolve('react-router-dom'),
      'source-map-support/register': require.resolve(
        'source-map-support/register'
      ),
      'styled-components': require.resolve('styled-components'),
      '@composition/components': require.resolve(
        '../../src/components/index.ts'
      ),
      '@composition/contexts': require.resolve('../../src/contexts/index.ts')
    },
    extensions: [
      '.tsx',
      '.ts',
      '.mjsx',
      '.mjs',
      '.jsx',
      '.js',
      '.cjsx',
      '.cjs',
      '.yaml',
      '.yml',
      '.json',
      '.scss',
      '.sass',
      '.css'
    ]
  }
}
