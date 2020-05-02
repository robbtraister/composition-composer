'use strict'

import React, { memo, useEffect, useState } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'

import { CommonRoot } from './common'

const LocationWatcher = memo(function LocationWatcher(
  props: Composition.ClientRootProps
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
  const [context, setContext] = useState<Composition.RootProps>({
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
      document.title = page.title
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

  return <CommonRoot value={context} />
})

export const Root = memo(function Root(props: Composition.ClientRootProps) {
  return (
    <BrowserRouter>
      <LocationWatcher {...props} />
    </BrowserRouter>
  )
})

export default Root
