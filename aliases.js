'use strict'

module.exports = [
  'prop-types/checkPropTypes',
  'prop-types',
  'react',
  'react-dom/server',
  'react-dom',
  'react-router',
  'react-router-dom',
  'source-map-support/register',
  'styled-components'
].reduce(
  (aliases, mod) => {
    aliases[mod] = require.resolve(mod)
    return aliases
  },
  {
    '@composition/components': require.resolve('./src/components/index.ts'),
    '@composition/contexts': require.resolve('./src/contexts/index.ts'),
    '@composition/composer': require.resolve('./src/index.ts'),
    '@composition/composer/components': require.resolve(
      './src/components/index.ts'
    ),
    '@composition/composer/contexts': require.resolve('./src/contexts/index.ts')
  }
)
