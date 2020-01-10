'use strict'

import path from 'path'

import React, { useContext } from 'react'

import Resource from '../resource'

import compositionContext from '../../contexts/composition'

const StyledComponents = 'composition:styled-components'

interface StylesProps {
  inline?: boolean
}
interface StyleProps {
  id?: string
  name: string
}

const InlineStyle = ({ resource, ...passThroughProps }: ResourceStruct) => (
  <style {...passThroughProps} dangerouslySetInnerHTML={{ __html: resource }} />
)

export const Styles = ({ inline, ...passThroughProps }: StylesProps) => {
  const { appStyles = 'app', siteStyles = 'site' } = useContext(
    compositionContext
  )

  const Style = inline
    ? function Style({ name, ...compositionProps }: StyleProps) {
        const resourceProps = {
          ...compositionProps,
          ...passThroughProps,
          name: path.join('build', 'dist', `${name}.css`),
          component: undefined,
          render: InlineStyle
        }
        return <Resource {...resourceProps} />
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
