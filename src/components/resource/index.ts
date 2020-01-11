'use strict'

import {
  Resource as ClientResource,
  useResource as useClientResource
} from './client'
import {
  Resource as ServerResource,
  useResource as useServerResource
} from './server'

import { isClient } from '../utils'

export const Resource = isClient ? ClientResource : ServerResource
export const useResource = isClient ? useClientResource : useServerResource

export default Resource
