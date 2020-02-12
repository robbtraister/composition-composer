'use strict'

import React from 'react'

import { EntryComponent, ExitComponent } from './common'

export const Static = ({
  id,
  children
}: {
  id: string
  children: React.ReactNode
}) => (
  <>
    <EntryComponent key={EntryComponent.prefix} id={id} />
    {children}
    <ExitComponent key={ExitComponent.prefix} id={id} />
  </>
)

export default Static
