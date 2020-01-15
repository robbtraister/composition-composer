'use strict'

import { withTimer as withClientTimer } from './client'
import { withTimer as withServerTimer } from './server'

import { isClient } from '../utils'

export const withTimer = isClient ? withClientTimer : withServerTimer

export default withTimer
