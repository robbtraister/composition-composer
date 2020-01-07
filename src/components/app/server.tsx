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
  id?: string
  static?: boolean
  'single-page'?: boolean
}

export function App(props: ServerAppProps) {
  const { appName = 'app', cache, output, template, tree } = useContext(
    compositionContext
  )
  const {
    id = 'composition-app',
    static: isStatic = false,
    'single-page': singlePage = false
  } = props

  if (isStatic && singlePage) {
    throw new Error('`static` and `single-page` props are mutually-exclusive')
  }

  const contentCache = Object.keys(cache)
    .filter(entry => !(cache[entry] instanceof Promise))
    .filter(entry => entry.startsWith('{"content":'))
    .reduce((rollup, entry) => {
      rollup[entry] = cache[entry]
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
          <Script name={singlePage ? `combinations/${output}` : appName} />
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
              `Composition.id=${JSON.stringify(id)}`,
              `Composition.singlePage=${JSON.stringify(singlePage)}`,
              `Composition.cache=${JSON.stringify(contentCache)}`,
              singlePage
                ? `Composition.template=${JSON.stringify(template)}`
                : null,
              singlePage ? `Composition.tree=${JSON.stringify(tree)}` : null
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
