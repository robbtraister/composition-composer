'use strict'

import { Meta as ClientMeta } from './client'
import { Meta as ServerMeta } from './server'

import { isClient } from '../utils'

export const Meta = isClient ? ClientMeta : ServerMeta

export default Meta
