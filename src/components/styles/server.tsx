'use strict'

import { promises as fsPromises } from 'fs'
import path from 'path'

import React, { useContext } from 'react'

import compositionContext from '../../contexts/composition'

const StyledComponents = 'composition:styled-components'

interface StylesProps {
  inline?: boolean
}
interface StyleProps {
  id?: string
  name: string
}

const cachedFiles = {}
async function getCachedFile(filePath) {
  try {
    cachedFiles[filePath] =
      cachedFiles[filePath] || (await fsPromises.readFile(filePath))
  } catch (_) {}
  return cachedFiles[filePath]
}

export const Styles = ({ inline, ...passThroughProps }: StylesProps) => {
  const {
    appStyles = 'app',
    cache = {},
    projectRoot,
    siteStyles = 'site'
  } = useContext(compositionContext)

  const Style = inline
    ? function Style({ name }: StyleProps) {
        const key = JSON.stringify({ styles: name })
        if (key in cache) {
          return cache[key]
        }
        cache[key] = getCachedFile(
          path.join(projectRoot, 'build', 'dist', `${name}.css`)
        )
          .then(data => {
            cache[key] = (
              <style
                {...passThroughProps}
                dangerouslySetInnerHTML={{ __html: data }}
              />
            )
          })
          .catch(() => {
            cache[key] = null
          })
        return null
      }
    : function Style({ name, ...compositionProps }: StyleProps) {
        return (
          <link
            {...compositionProps}
            {...passThroughProps}
            href={`/dist/${name}.css`}
            rel="stylesheet"
          />
        )
      }

  return (
    <>
      <Style name={siteStyles} id="composition-site-styles" />
      <Style name={appStyles} id="composition-app-styles" />
      <StyledComponents />
    </>
  )
}

export default Styles
