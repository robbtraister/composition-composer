'use strict'

import React, { useContext } from 'react'

import Tree from '../tree'
import compositionContext from '../../contexts/composition'

const polyfills = {
  assign: '(window.Object&&window.Object.assign)',
  fetch: 'window.fetch',
  includes: 'Array.prototype.includes',
  map: 'window.Map',
  promise: 'window.Promise',
  set: 'window.Set'
}

interface ScriptProps {
  name: string
}

const Script = ({ name }: ScriptProps) => (
  <script type="text/javascript" src={`/dist/${name}.js`} defer />
)

interface ServerAppProps {
  'hydrate-only'?: boolean
  id?: string
  static?: boolean
  'single-page'?: boolean
}

export function App(props: ServerAppProps) {
  const { appName = 'app', cache, output, template, tree } = useContext(
    compositionContext
  )
  const {
    'hydrate-only': hydrateOnly = false,
    id = 'composition-app',
    static: isStatic = false,
    'single-page': singlePage = false
  } = props

  if ([hydrateOnly, isStatic, singlePage].filter(p => p).length > 1) {
    throw new Error(
      '`hydrate-only`, `static`, and `single-page` props are mutually-exclusive'
    )
  }

  const isCombinations = hydrateOnly || singlePage

  const contentCache = Object.keys(cache)
    .filter(key => key.startsWith('{"content":'))
    .reduce((rollup, key) => {
      rollup[key] = { value: (cache[key] || {}).value }
      return rollup
    }, {})

  return (
    <>
      {!isStatic && (
        <>
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `if(!(${Object.values(polyfills).join(
                '&&'
              )}))document.write('<script type="text/javascript" src="/dist/polyfills.js" defer=""><\\/script>');`
            }}
          />
          <Script name="runtime" />
          <Script name="engine" />
          <Script name={isCombinations ? `combinations/${output}` : appName} />
        </>
      )}
      <div id={id}>
        <Tree />
      </div>
      {!isStatic && (
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: [
              `window.Composition=window.Composition||{}`,
              `Composition.cache=${JSON.stringify(contentCache)}`,
              `Composition.id=${JSON.stringify(id)}`,
              `Composition.method=${JSON.stringify(
                hydrateOnly ? 'hydrate' : 'render'
              )}`,
              `Composition.singlePage=${JSON.stringify(singlePage)}`,
              isCombinations
                ? `Composition.template=${JSON.stringify(template)}`
                : null,
              isCombinations ? `Composition.tree=${JSON.stringify(tree)}` : null
            ]
              .filter(c => c)
              .join(';')
          }}
        />
      )}
    </>
  )
}

export default App
