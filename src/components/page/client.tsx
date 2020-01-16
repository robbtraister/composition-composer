'use strict'

import React, { memo, useEffect, useState } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'

import { CommonPage } from './common'

const LocationWatcher = memo(function LocationWatcher(
  props: Composition.ClientPageProps
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
  const [context, setContext] = useState<Composition.PageProps>({
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

  return <CommonPage value={context} />
})

export const Page = memo(function Page(props: Composition.ClientPageProps) {
  return (
    <BrowserRouter>
      <LocationWatcher {...props} />
    </BrowserRouter>
  )
})

export default Page
