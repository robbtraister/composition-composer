'use strict'

import {
  Quarantine as ClientQuarantine,
  verifyNode as clientVerify
} from './client'
import {
  Quarantine as ServerQuarantine,
  verifyNode as serverVerify
} from './server'

import { isClient } from '../utils'

export const Quarantine = isClient ? ClientQuarantine : ServerQuarantine
export const verifyNode = isClient ? clientVerify : serverVerify

export default Quarantine
