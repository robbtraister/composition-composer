'use strict'

import { Resource as ClientResource } from './client'
import { Resource as ServerResource } from './server'

import { isClient } from '../utils'

export const Resource = isClient ? ClientResource : ServerResource

export default Resource
