'use strict'

import React from 'react'

export const EntryComponent = ({ id }: { id: string }) => (
  <div id={`${EntryComponent.prefix}:${id}`} style={{ display: 'none' }} />
)

EntryComponent.prefix = 'composition-static-enter'

export const ExitComponent = ({
  id,
  divRef
}: {
  id: string
  divRef?: React.RefObject<HTMLDivElement>
}) => (
  <div
    id={`${ExitComponent.prefix}:${id}`}
    style={{ display: 'none' }}
    ref={divRef}
  />
)

ExitComponent.prefix = 'composition-static-exit'
