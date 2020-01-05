'use strict'

import { Styles as ClientStyles } from './client'
import { Styles as ServerStyles } from './server'

import { isClient } from '../../utils'

export const Styles = isClient ? ClientStyles : ServerStyles

export default Styles
