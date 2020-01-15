'use strict'

import { Page as ClientPage } from './client'
import { Page as ServerPage } from './server'

import { isClient } from '../utils'

export const Page = isClient ? ClientPage : ServerPage

export default Page
