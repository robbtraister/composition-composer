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
    '@composition/components': require.resolve('@composition/components'),
    '@composition/contexts': require.resolve(
      '@composition/components/dist/contexts'
    ),
    '@composition/composer': require.resolve('@composition/components'),
    '@composition/composer/components': require.resolve(
      '@composition/components/dist/components'
    ),
    '@composition/composer/contexts': require.resolve(
      '@composition/components/dist/contexts'
    )
  }
)
