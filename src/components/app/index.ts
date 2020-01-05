'use strict'

import { App as ClientApp } from './client'
import { App as ServerApp } from './server'

import { isClient } from '../../utils'

export const App = isClient ? ClientApp : ServerApp

export default App
