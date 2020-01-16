'use strict'

import { Title as ClientTitle } from './client'
import { Title as ServerTitle } from './server'

import { isClient } from '../utils'

export const Title = isClient ? ClientTitle : ServerTitle

export default Title
