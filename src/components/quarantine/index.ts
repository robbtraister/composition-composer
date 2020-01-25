'use strict'

import {
  Quarantine as ClientQuarantine,
  verify as clientVerify
} from './client'
import {
  Quarantine as ServerQuarantine,
  verify as serverVerify
} from './server'

import { isClient } from '../utils'

export const Quarantine = isClient ? ClientQuarantine : ServerQuarantine
export const verify = isClient ? clientVerify : serverVerify

export default Quarantine
