'use strict'

import { Quarantine as ClientQuarantine } from './client'
import { Quarantine as ServerQuarantine } from './server'

import { isClient } from '../utils'

export const Quarantine = isClient ? ClientQuarantine : ServerQuarantine

export default Quarantine
