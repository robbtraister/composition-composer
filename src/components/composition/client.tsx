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
  resolve?: (String) => Promise<Resolution>
  'single-page'?: boolean
}

function LocationWatcher(props: ClientCompositionProps) {
  const { 'single-page': singlePage, resolve, ...contextValue } = props

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
    isInitialized && awaitResolve()
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
      <LocationWatcher {...props} />
    </BrowserRouter>
  )
}

export default Composition
