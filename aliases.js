'use strict'

module.exports = Object.assign(
  [
    'prop-types/checkPropTypes',
    // access original prop-types with trailing /index if necessary
    'prop-types/index',
    'react',
    'react-dom/server',
    'react-dom',
    'react-router',
    'react-router-dom',
    'source-map-support/register',
    'styled-components'
  ].reduce((aliases, mod) => {
    aliases[mod] = require.resolve(mod)
    return aliases
  }, {}),
  {
    // use assign instead of reduce init because prop-types must appear after prop-types/* entries
    // can't rely on webpack $ because we also mock-require for babel register
    'prop-types': require.resolve('./build/utils/prop-types.js'),
    '@composition/components': require.resolve('./src/components/index.ts'),
    '@composition/contexts': require.resolve('./src/contexts/index.ts'),
    '@composition/composer': require.resolve('./src/index.ts'),
    '@composition/composer/components': require.resolve(
      './src/components/index.ts'
    ),
    '@composition/composer/contexts': require.resolve('./src/contexts/index.ts')
  }
)
