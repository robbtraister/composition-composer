'use strict'

module.exports = {
  ...[
    'prop-types/checkPropTypes',
    'prop-types',
    'react',
    'react-dom/server',
    'react-dom',
    'react-router',
    'react-router-dom',
    'source-map-support/register',
    'styled-components',
    '@composition/components'
  ].reduce((aliases, mod) => {
    aliases[mod] = require.resolve(mod)
    return aliases
  }, {}),
  ...{
    '@composition/composer': require.resolve('@composition/components'),
    '@composition/composer/components': require.resolve(
      '@composition/components'
    ),
    '@composition/composer/contexts': require.resolve(
      '@composition/components/dist/contexts'
    ),
    '@composition/contexts': require.resolve(
      '@composition/components/dist/contexts'
    )
  }
}
