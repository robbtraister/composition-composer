'use strict'

import React from 'react'

import { render } from '../render'

import { usePageContext } from '../../contexts/page'

interface MetaProps extends Composition.RenderProps<{}> {
  name?: string
}

const isCharset = name => /^charset$/i.test(name)

const DefaultMeta = ({ name, content }: Composition.MetaStruct) =>
  isCharset(name) ? (
    <meta charSet={content} />
  ) : (
    <meta name={name} content={content} />
  )

export const useMeta = (name: string): string | Map<string, string> => {
  const { meta = {} } = usePageContext()
  return name ? meta[name] : meta
}

// this is to ensure that charset is always first (an amp spec requirement)
function getMetaNames(metaObject) {
  const metaKeys = Object.keys(metaObject)
  const charsetKey = metaKeys.find(isCharset)

  return [].concat(
    charsetKey || [],
    metaKeys.filter(key => key !== charsetKey)
  )
}

export const Meta = (props: MetaProps) => {
  const { name } = props
  const meta = useMeta(name)

  const metaData = name
    ? { name, content: meta }
    : {
        meta: getMetaNames(meta).map(name => ({
          name,
          content: meta[name]
        }))
      }

  const children = name
    ? props => <DefaultMeta {...props} />
    : ({ meta, ...props }) =>
        meta.map(meta => <DefaultMeta key={meta.name} {...props} {...meta} />)

  return render({
    // default implementation; can be overridden
    children,
    ...props,
    ...metaData
  })
}

export default Meta
