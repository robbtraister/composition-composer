'use strict'

import { Root as ClientRoot } from './client'
import { Root as ServerRoot } from './server'

import { isClient } from '../utils'

export const Root = isClient ? ClientRoot : ServerRoot

export default Root
