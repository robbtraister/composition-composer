'use strict'

import { Static as ClientStatic } from './client'
import { Static as ServerStatic } from './server'

import { isClient } from '../utils'

export const Static = isClient ? ClientStatic : ServerStatic

export default Static
