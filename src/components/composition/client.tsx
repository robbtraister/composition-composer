'use strict'

import React, { memo, useEffect, useState } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'

import { Common } from './common'

const LocationWatcher = memo(function LocationWatcher(
  props: Composition.ClientCompositionProps
) {
  const {
    pageContent,
    resolve,
    'single-page': singlePage,
    template,
    tree,
    ...contextProps
  } = props

  const [isInitialized, setInitialized] = useState<boolean>(false)
  const [context, setContext] = useState<Composition.CompositionProps>({
    pageContent,
    template,
    tree,
    ...contextProps
  })
  const location = useLocation()

  const forceRefresh = !singlePage || !resolve
  const uri = location.pathname + location.search

  useEffect(() => {
    let doUpdate = true

    const awaitResolve = async () => {
      const page = await resolve(uri)
      doUpdate &&
        setContext({
          ...contextProps,
          ...page
        })
    }
    forceRefresh
      ? // fix back button
        isInitialized && window.location.reload()
      : awaitResolve()
    setInitialized(true)

    return () => {
      doUpdate = false
    }
  }, [resolve, uri])

  return <Common value={context} />
})

export const Composition = memo(function Composition(
  props: Composition.ClientCompositionProps
) {
  return (
    <BrowserRouter>
      <LocationWatcher {...props} />
    </BrowserRouter>
  )
})

export default Composition
