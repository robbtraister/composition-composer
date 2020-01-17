'use strict'

import { withQuarantine as withClientQuarantine } from './client'
import { withQuarantine as withServerQuarantine } from './server'

import { isClient } from '../utils'

export const withQuarantine = isClient
  ? withClientQuarantine
  : withServerQuarantine

export default withQuarantine
