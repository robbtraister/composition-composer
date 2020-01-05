'use strict'

import { Composition as ClientComposition } from './client'
import { Composition as ServerComposition } from './server'

import { isClient } from '../../utils'

export const Composition = isClient ? ClientComposition : ServerComposition

export default Composition
