'use strict'

import React, { useEffect, useState } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'

import { Common, CompositionProps } from './common'

import { TreeNode } from '../tree'

interface Resolution {
  template: string
  tree: TreeNode
  pageContent: object
}

interface ClientCompositionProps extends CompositionProps {
  forceRefresh?: boolean
  resolve?: (String) => Promise<Resolution>
  'single-page'?: boolean
}

function LocationWatcher(props: ClientCompositionProps) {
  const {
    forceRefresh = true,
    resolve,
    'single-page': singlePage,
    ...contextValue
  } = props

  const [isInitialized, setInitialized] = useState(false)
  const [{ tree, pageContent }, setPage] = useState<Resolution>({
    template: props.template,
    tree: props.tree,
    pageContent: props.pageContent
  })
  const location = useLocation()

  useEffect(() => {
    let doUpdate = true

    const awaitResolve = async () => {
      const page = await resolve(location)
      doUpdate && setPage(page)
    }
    if (isInitialized) {
      forceRefresh
        ? // fix back button
          window.location.reload()
        : awaitResolve()
    }
    setInitialized(true)

    return () => {
      doUpdate = false
    }
  }, [location])

  return (
    <Common
      value={{
        ...contextValue,
        tree,
        pageContent
      }}
    />
  )
}

export function Composition(props: ClientCompositionProps) {
  const { 'single-page': singlePage, resolve } = props

  const forceRefresh = !singlePage || !resolve

  return (
    <BrowserRouter forceRefresh={forceRefresh}>
      <LocationWatcher {...props} forceRefresh={forceRefresh} />
    </BrowserRouter>
  )
}

export default Composition
