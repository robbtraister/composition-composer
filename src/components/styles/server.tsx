'use strict'

import path from 'path'

import React from 'react'

import { render } from '../render'
import { useResource } from '../resource'

import { usePageContext } from '../../contexts/page'

export const StyledComponents = 'composition:styled-components'

interface StylesProps extends Composition.RenderProps<{}> {
  amp?: boolean
  inline?: boolean
}

export const useStyles = () => {
  const { appStyles = 'app', outputStyles = 'site' } = usePageContext()
  const outputStylesContent = useResource({
    name: path.join('build', 'dist', `${outputStyles}.css`)
  })
  const appStylesContent = useResource({
    name: path.join('build', 'dist', `${appStyles}.css`)
  })

  return `${outputStylesContent || ''}${appStylesContent ||
    ''}<${StyledComponents}></${StyledComponents}>`
}

const StyleTag = ({ styles, ...props }: Composition.StylesStruct) => (
  <style {...props} dangerouslySetInnerHTML={{ __html: styles }} />
)

const InlineStyles = ({ amp, ...props }) => {
  const styles = useStyles()

  return render({
    // default implementation; can be overridden
    children: StyleTag,
    ...props,
    'amp-custom': amp ? '' : null,
    styles
  })
}

const StyleLink = props => <link {...props} rel="stylesheet" type="text/css" />

const LinkStyles = props => {
  const { appStyles = 'app', outputStyles = 'site' } = usePageContext()

  return (
    <>
      <StyleLink
        id="composition-output-styles"
        {...props}
        href={`/dist/${outputStyles}.css`}
      />
      <StyleLink
        id="composition-app-styles"
        {...props}
        href={`/dist/${appStyles}.css`}
      />
      <style>
        <StyledComponents />
      </style>
    </>
  )
}

export const Styles = ({
  amp = false,
  inline,
  ...passThroughProps
}: StylesProps) => {
  if (amp && inline === false) {
    throw new Error('`amp` implies that `inline` is true')
  }
  return amp || inline ? (
    <InlineStyles {...passThroughProps} amp={amp} />
  ) : (
    <LinkStyles {...passThroughProps} />
  )
}

export default Styles
